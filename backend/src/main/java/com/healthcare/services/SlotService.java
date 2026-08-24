package com.healthcare.services;

import com.healthcare.dto.AvailableSlotsResponse;
import com.healthcare.dto.AvailableSlotsResponse.SlotInfo;
import com.healthcare.models.Appointment;
import com.healthcare.models.DoctorProfile;
import com.healthcare.models.DoctorWorkingHours;
import com.healthcare.repositories.AppointmentRepository;
import com.healthcare.repositories.DoctorLeaveRepository;
import com.healthcare.repositories.DoctorWorkingHoursRepository;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.repositories.DoctorProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes available (bookable) time slots for a doctor on a given date.
 *
 * Algorithm:
 *   1. Check if doctor is on leave that day → return empty list
 *   2. Lookup working hours for that day-of-week → no entry = day off → empty
 *   3. Generate all possible slots from start_time to end_time using slot_duration_minutes
 *   4. Query existing HELD/CONFIRMED appointments for that (doctor, date)
 *   5. Remove occupied slots
 *   6. Return the remaining available slots
 *
 * Time complexity: O(S + A) where S = total slots in the day, A = active appointments.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SlotService {

    private final DoctorProfileRepository      doctorProfileRepo;
    private final DoctorWorkingHoursRepository  workingHoursRepo;
    private final DoctorLeaveRepository         leaveRepo;
    private final AppointmentRepository         appointmentRepo;

    /**
     * Compute all free slots for a given doctor on a given date.
     */
    public AvailableSlotsResponse getAvailableSlots(UUID doctorProfileId, LocalDate date) {

        // 1. Load doctor profile
        DoctorProfile doctor = doctorProfileRepo.findById(doctorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor profile not found: " + doctorProfileId));

        int slotDuration = doctor.getSlotDurationMinutes();
        String doctorName = doctor.getUser().getName();
        String specialisation = doctor.getSpecialisation();

        // Day info
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        // Java DayOfWeek: MONDAY=1...SUNDAY=7  → our schema: 0=Sunday...6=Saturday
        int dayNumber = dayOfWeek == DayOfWeek.SUNDAY ? 0 : dayOfWeek.getValue();
        String dayName = dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        // 2. Check if doctor is on leave
        boolean onLeave = leaveRepo.existsByDoctorProfileIdAndLeaveDate(doctorProfileId, date);
        if (onLeave) {
            log.info("Doctor {} is on leave on {}", doctorProfileId, date);
            return AvailableSlotsResponse.builder()
                    .doctorName(doctorName)
                    .specialisation(specialisation)
                    .date(date)
                    .dayOfWeek(dayName)
                    .slotDurationMinutes(slotDuration)
                    .slots(Collections.emptyList())
                    .build();
        }

        // 3. Get working hours for that day
        DoctorWorkingHours hours = workingHoursRepo
                .findByDoctorProfileIdAndDayOfWeek(doctorProfileId, dayNumber);

        if (hours == null) {
            log.info("No working hours for doctor {} on {} (day {})", doctorProfileId, date, dayName);
            return AvailableSlotsResponse.builder()
                    .doctorName(doctorName)
                    .specialisation(specialisation)
                    .date(date)
                    .dayOfWeek(dayName)
                    .slotDurationMinutes(slotDuration)
                    .slots(Collections.emptyList())
                    .build();
        }

        // 4. Generate all possible slots
        List<SlotInfo> allSlots = generateSlots(hours.getStartTime(), hours.getEndTime(), slotDuration);

        // 5. Get currently occupied slots (HELD or CONFIRMED)
        List<Appointment> activeAppointments =
                appointmentRepo.findActiveByDoctorAndDate(doctorProfileId, date);

        Set<LocalTime> occupiedStartTimes = activeAppointments.stream()
                .map(Appointment::getStartTime)
                .collect(Collectors.toSet());

        // 6. Filter out occupied
        List<SlotInfo> freeSlots = allSlots.stream()
                .filter(slot -> !occupiedStartTimes.contains(slot.getStartTime()))
                .collect(Collectors.toList());

        log.info("Doctor {} on {}: {} total slots, {} occupied, {} free",
                doctorProfileId, date, allSlots.size(), occupiedStartTimes.size(), freeSlots.size());

        return AvailableSlotsResponse.builder()
                .doctorName(doctorName)
                .specialisation(specialisation)
                .date(date)
                .dayOfWeek(dayName)
                .slotDurationMinutes(slotDuration)
                .slots(freeSlots)
                .build();
    }

    /**
     * Validate that a specific slot is bookable (exists in working hours, not occupied, not on leave).
     * Used by AppointmentService before acquiring the Redis lock.
     */
    public boolean isSlotBookable(UUID doctorProfileId, LocalDate date, LocalTime startTime) {

        // On leave?
        if (leaveRepo.existsByDoctorProfileIdAndLeaveDate(doctorProfileId, date)) {
            return false;
        }

        // Has working hours for that day?
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        int dayNumber = dayOfWeek == DayOfWeek.SUNDAY ? 0 : dayOfWeek.getValue();
        DoctorWorkingHours hours = workingHoursRepo
                .findByDoctorProfileIdAndDayOfWeek(doctorProfileId, dayNumber);

        if (hours == null) {
            return false;
        }

        // Is the start time within working hours and aligns to slot boundaries?
        DoctorProfile doctor = doctorProfileRepo.findById(doctorProfileId).orElse(null);
        if (doctor == null) return false;

        int slotDuration = doctor.getSlotDurationMinutes();
        if (startTime.isBefore(hours.getStartTime()) ||
            startTime.plusMinutes(slotDuration).isAfter(hours.getEndTime())) {
            return false;
        }

        // Verify slot alignment: startTime must be at a valid slot boundary
        long minutesSinceStart = java.time.Duration.between(hours.getStartTime(), startTime).toMinutes();
        if (minutesSinceStart % slotDuration != 0) {
            return false;
        }

        // Already occupied?
        List<Appointment> existing = appointmentRepo.findActiveByDoctorAndDate(doctorProfileId, date);
        return existing.stream().noneMatch(a -> a.getStartTime().equals(startTime));
    }

    // ── Internal ──────────────────────────────────────────────────────────

    /**
     * Generate slot intervals from startTime to endTime.
     * Example: start=09:00, end=17:00, duration=30 → 09:00, 09:30, 10:00, ..., 16:30
     */
    private List<SlotInfo> generateSlots(LocalTime startTime, LocalTime endTime, int durationMinutes) {
        List<SlotInfo> slots = new ArrayList<>();
        LocalTime current = startTime;

        while (current.plusMinutes(durationMinutes).isBefore(endTime)
                || current.plusMinutes(durationMinutes).equals(endTime)) {
            slots.add(SlotInfo.builder()
                    .startTime(current)
                    .endTime(current.plusMinutes(durationMinutes))
                    .available(true)
                    .build());
            current = current.plusMinutes(durationMinutes);
        }

        return slots;
    }
}
