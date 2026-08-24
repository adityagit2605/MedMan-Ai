package com.healthcare.services;

import com.healthcare.dto.*;
import com.healthcare.dto.CreateDoctorRequest.WorkingHourEntry;
import com.healthcare.dto.DoctorResponse.WorkingHourSlot;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.models.*;
import com.healthcare.models.Appointment.AppointmentStatus;
import com.healthcare.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin-only operations:
 *   - Create doctor (user + profile + working hours in one transaction)
 *   - Update doctor profile / working hours
 *   - Mark doctor leave → trigger conflict handler
 *   - List all doctors
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository                userRepo;
    private final DoctorProfileRepository       doctorProfileRepo;
    private final DoctorWorkingHoursRepository   workingHoursRepo;
    private final DoctorLeaveRepository          leaveRepo;
    private final AppointmentRepository          appointmentRepo;
    private final PasswordEncoder                passwordEncoder;
    private final NotificationService            notificationService;

    // ═══════════════════════════════════════════════════════════════════════
    //  CREATE DOCTOR
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public DoctorResponse createDoctor(CreateDoctorRequest request) {

        if (userRepo.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        // 1. Create User with DOCTOR role
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.DOCTOR)
                .phone(request.getPhone())
                .build();
        userRepo.save(user);

        // 2. Create DoctorProfile
        DoctorProfile profile = DoctorProfile.builder()
                .user(user)
                .specialisation(request.getSpecialisation())
                .slotDurationMinutes(request.getSlotDurationMinutes())
                .bio(request.getBio())
                .build();
        doctorProfileRepo.save(profile);

        // 3. Create working hours
        List<DoctorWorkingHours> savedHours = new ArrayList<>();
        if (request.getWorkingHours() != null) {
            for (WorkingHourEntry entry : request.getWorkingHours()) {
                DoctorWorkingHours wh = DoctorWorkingHours.builder()
                        .doctorProfile(profile)
                        .dayOfWeek(entry.getDayOfWeek())
                        .startTime(LocalTime.parse(entry.getStartTime()))
                        .endTime(LocalTime.parse(entry.getEndTime()))
                        .build();
                savedHours.add(workingHoursRepo.save(wh));
            }
        }

        log.info("Doctor created: userId={}, profileId={}, email={}",
                user.getId(), profile.getId(), user.getEmail());

        return toResponse(profile, user, savedHours);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  UPDATE DOCTOR
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public DoctorResponse updateDoctor(UUID doctorProfileId, UpdateDoctorRequest request) {

        DoctorProfile profile = doctorProfileRepo.findById(doctorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found: " + doctorProfileId));

        User user = profile.getUser();

        // Partial updates — only non-null fields
        if (request.getSpecialisation() != null) {
            profile.setSpecialisation(request.getSpecialisation());
        }
        if (request.getSlotDurationMinutes() != null) {
            profile.setSlotDurationMinutes(request.getSlotDurationMinutes());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
            userRepo.save(user);
        }
        doctorProfileRepo.save(profile);

        // Replace working hours if provided
        List<DoctorWorkingHours> savedHours;
        if (request.getWorkingHours() != null && !request.getWorkingHours().isEmpty()) {
            workingHoursRepo.deleteByDoctorProfileId(doctorProfileId);
            savedHours = new ArrayList<>();
            for (WorkingHourEntry entry : request.getWorkingHours()) {
                DoctorWorkingHours wh = DoctorWorkingHours.builder()
                        .doctorProfile(profile)
                        .dayOfWeek(entry.getDayOfWeek())
                        .startTime(LocalTime.parse(entry.getStartTime()))
                        .endTime(LocalTime.parse(entry.getEndTime()))
                        .build();
                savedHours.add(workingHoursRepo.save(wh));
            }
        } else {
            savedHours = workingHoursRepo.findByDoctorProfileIdOrderByDayOfWeek(doctorProfileId);
        }

        log.info("Doctor updated: profileId={}", doctorProfileId);
        return toResponse(profile, user, savedHours);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  MARK LEAVE (+ conflict handler)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Mark a doctor on leave for a specific date.
     *
     * Leave Conflict Handler (LLD §2.4):
     *   If there are existing HELD/CONFIRMED appointments on that date,
     *   set them to LEAVE_CONFLICT and queue notifications.
     */
    @Transactional
    public Map<String, Object> markLeave(UUID doctorProfileId, CreateLeaveRequest request) {

        DoctorProfile profile = doctorProfileRepo.findById(doctorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found: " + doctorProfileId));

        // Check if already on leave
        if (leaveRepo.existsByDoctorProfileIdAndLeaveDate(doctorProfileId, request.getLeaveDate())) {
            throw new IllegalArgumentException("Doctor is already on leave on " + request.getLeaveDate());
        }

        // Save leave
        DoctorLeave leave = DoctorLeave.builder()
                .doctorProfile(profile)
                .leaveDate(request.getLeaveDate())
                .reason(request.getReason())
                .build();
        leaveRepo.save(leave);

        // ── Conflict handler ─────────────────────────────────────────────
        List<Appointment> conflicting =
                appointmentRepo.findConflictingAppointments(doctorProfileId, request.getLeaveDate());

        int conflictCount = 0;
        for (Appointment appt : conflicting) {
            appt.setStatus(AppointmentStatus.LEAVE_CONFLICT);
            appointmentRepo.save(appt);
            conflictCount++;

            // Queue leave-conflict notification to the patient
            notificationService.queueLeaveConflictNotification(appt);
            log.info("Leave conflict: appointment={} marked LEAVE_CONFLICT", appt.getId());
        }

        log.info("Leave marked: doctor={}, date={}, conflicts={}",
                doctorProfileId, request.getLeaveDate(), conflictCount);

        return Map.of(
                "message", "Leave recorded successfully",
                "leaveDate", request.getLeaveDate().toString(),
                "affectedAppointments", conflictCount
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /** List all doctors (admin view) */
    public List<DoctorResponse> getAllDoctors() {
        return doctorProfileRepo.findAll().stream()
                .map(profile -> {
                    List<DoctorWorkingHours> hours =
                            workingHoursRepo.findByDoctorProfileIdOrderByDayOfWeek(profile.getId());
                    return toResponse(profile, profile.getUser(), hours);
                })
                .collect(Collectors.toList());
    }

    /** Get single doctor by profile ID */
    public DoctorResponse getDoctor(UUID doctorProfileId) {
        DoctorProfile profile = doctorProfileRepo.findById(doctorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found: " + doctorProfileId));
        List<DoctorWorkingHours> hours =
                workingHoursRepo.findByDoctorProfileIdOrderByDayOfWeek(doctorProfileId);
        return toResponse(profile, profile.getUser(), hours);
    }

    /** Search doctors by specialisation */
    public List<DoctorResponse> searchDoctors(String specialisation) {
        List<DoctorProfile> profiles;
        if (specialisation == null || specialisation.isBlank()) {
            profiles = doctorProfileRepo.findAll();
        } else {
            profiles = doctorProfileRepo.findBySpecialisationContainingIgnoreCase(specialisation);
        }

        return profiles.stream()
                .map(profile -> {
                    List<DoctorWorkingHours> hours =
                            workingHoursRepo.findByDoctorProfileIdOrderByDayOfWeek(profile.getId());
                    return toResponse(profile, profile.getUser(), hours);
                })
                .collect(Collectors.toList());
    }

    /** Get all leaves for a doctor */
    public List<Map<String, Object>> getDoctorLeaves(UUID doctorProfileId) {
        if (!doctorProfileRepo.existsById(doctorProfileId)) {
            throw new ResourceNotFoundException("Doctor profile not found: " + doctorProfileId);
        }
        return leaveRepo.findByDoctorProfileIdOrderByLeaveDate(doctorProfileId).stream()
                .map(leave -> Map.<String, Object>of(
                        "id", leave.getId(),
                        "leaveDate", leave.getLeaveDate().toString(),
                        "reason", leave.getReason() != null ? leave.getReason() : ""
                ))
                .collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RESPONSE MAPPER
    // ═══════════════════════════════════════════════════════════════════════

    private DoctorResponse toResponse(DoctorProfile profile, User user,
                                       List<DoctorWorkingHours> hours) {
        List<WorkingHourSlot> hourSlots = hours.stream()
                .map(wh -> {
                    // Convert dayOfWeek number to name
                    DayOfWeek dow = wh.getDayOfWeek() == 0
                            ? DayOfWeek.SUNDAY
                            : DayOfWeek.of(wh.getDayOfWeek());
                    String dayName = dow.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                    return WorkingHourSlot.builder()
                            .dayOfWeek(wh.getDayOfWeek())
                            .dayName(dayName)
                            .startTime(wh.getStartTime())
                            .endTime(wh.getEndTime())
                            .build();
                })
                .collect(Collectors.toList());

        return DoctorResponse.builder()
                .doctorProfileId(profile.getId())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .specialisation(profile.getSpecialisation())
                .slotDurationMinutes(profile.getSlotDurationMinutes())
                .bio(profile.getBio())
                .workingHours(hourSlots)
                .build();
    }
}
