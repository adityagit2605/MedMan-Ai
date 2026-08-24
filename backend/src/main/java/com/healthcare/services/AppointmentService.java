package com.healthcare.services;

import com.healthcare.dto.*;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.models.*;
import com.healthcare.models.Appointment.AppointmentStatus;
import com.healthcare.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Core booking business logic implementing the Hold → Confirm flow.
 *
 * Booking lifecycle (from LLD §2.3):
 *   1. Patient calls holdSlot()  → Redis lock acquired → row inserted as HELD with expiry
 *   2. Patient calls confirmSlot() → status flipped to CONFIRMED, symptom form saved,
 *                                    LLM pre-visit call queued (async, off critical path)
 *   3. Patient or doctor calls cancelAppointment() → status flipped to CANCELLED,
 *                                                     notification queued
 *
 * Double-booking prevention: two layers
 *   Layer 1: RedisLockService.acquireLock() — fast rejection, no DB roundtrip
 *   Layer 2: DB partial unique index (doctor_id, appt_date, start_time) WHERE status IN (HELD, CONFIRMED)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository       appointmentRepo;
    private final DoctorProfileRepository     doctorProfileRepo;
    private final SymptomFormRepository       symptomFormRepo;
    private final VisitNoteRepository         visitNoteRepo;
    private final PrescriptionRepository      prescriptionRepo;
    private final RedisLockService            redisLockService;
    private final SlotService                 slotService;
    private final LlmClientService            llmClientService;
    private final NotificationService         notificationService;
    private final MedicationReminderScheduler reminderScheduler;

    @Value("${app.slot.hold.minutes}")
    private int holdMinutes;

    // ═══════════════════════════════════════════════════════════════════════
    //  HOLD SLOT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Attempt to hold a slot for the patient.
     *
     * @throws IllegalStateException  if the slot is not bookable or Redis lock fails (409)
     * @throws ResourceNotFoundException if doctor doesn't exist
     */
    @Transactional
    public AppointmentResponse holdSlot(UUID patientId, HoldSlotRequest request) {

        UUID      doctorId  = request.getDoctorId();
        var       date      = request.getDate();
        LocalTime startTime = request.getStartTime();

        // Validate the doctor exists
        DoctorProfile doctor = doctorProfileRepo.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found: " + doctorId));

        // Validate the slot is bookable (within working hours, not on leave, not occupied)
        if (!slotService.isSlotBookable(doctorId, date, startTime)) {
            throw new IllegalStateException("Slot is not available for booking");
        }

        // ── Layer 1: Redis distributed lock ──────────────────────────────
        boolean lockAcquired = redisLockService.acquireLock(doctorId, date, startTime);
        if (!lockAcquired) {
            throw new IllegalStateException("Slot is currently being booked by another patient");
        }

        try {
            // ── Layer 2: DB insert with partial unique index guard ──────
            LocalTime endTime = startTime.plusMinutes(doctor.getSlotDurationMinutes());

            Appointment appointment = Appointment.builder()
                    .patient(User.builder().id(patientId).build())
                    .doctor(doctor)
                    .apptDate(date)
                    .startTime(startTime)
                    .endTime(endTime)
                    .status(AppointmentStatus.HELD)
                    .holdExpiresAt(LocalDateTime.now().plusMinutes(holdMinutes))
                    .build();

            appointmentRepo.save(appointment);

            log.info("Slot HELD: patient={}, doctor={}, date={}, time={}, expires={}",
                    patientId, doctorId, date, startTime, appointment.getHoldExpiresAt());

            return toResponse(appointment);

        } finally {
            // Always release the Redis lock after DB operation completes
            redisLockService.releaseLock(doctorId, date, startTime);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CONFIRM APPOINTMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Confirm a HELD appointment. Patient must submit symptom form.
     * If hold has expired, the slot is released and a 400 is returned.
     *
     * Side-effects (async, off critical path):
     *   - LLM pre-visit summary is triggered (via Python microservice)
     *   - Booking confirmation email/calendar notifications are queued
     */
    @Transactional
    public AppointmentResponse confirmAppointment(UUID appointmentId, UUID patientId,
                                                   ConfirmAppointmentRequest request) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        // Ownership check
        if (!appointment.getPatient().getId().equals(patientId)) {
            throw new IllegalArgumentException("You can only confirm your own appointments");
        }

        // Status check
        if (appointment.getStatus() != AppointmentStatus.HELD) {
            throw new IllegalStateException("Appointment is not in HELD status (current: "
                    + appointment.getStatus() + ")");
        }

        // Expiry check
        if (appointment.getHoldExpiresAt() != null
                && LocalDateTime.now().isAfter(appointment.getHoldExpiresAt())) {
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointmentRepo.save(appointment);
            throw new IllegalStateException("Hold has expired. The slot has been released.");
        }

        // Flip status
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setHoldExpiresAt(null);
        appointmentRepo.save(appointment);

        // Save symptom form
        SymptomForm symptomForm = SymptomForm.builder()
                .appointment(appointment)
                .symptomsRaw(request.getSymptoms())
                .urgencyLevel(SymptomForm.UrgencyLevel.PENDING)
                .llmStatus(SymptomForm.LlmStatus.PENDING)
                .build();
        symptomFormRepo.save(symptomForm);

        // Trigger async LLM pre-visit summary (off critical path — LLD §2.5)
        llmClientService.generatePreVisitSummary(symptomForm.getId());

        // Queue notification (booking confirmation email + calendar event — LLD §2.6)
        notificationService.queueBookingConfirmation(appointment);

        log.info("Appointment CONFIRMED: id={}, patient={}", appointmentId, patientId);

        return toResponse(appointment);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CANCEL APPOINTMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Cancel an appointment. Patients can cancel their own; doctors can cancel any of theirs.
     */
    @Transactional
    public AppointmentResponse cancelAppointment(UUID appointmentId, UUID userId) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        // Authorization: must be the patient or the doctor
        boolean isPatient = appointment.getPatient().getId().equals(userId);
        boolean isDoctor  = appointment.getDoctor().getUser().getId().equals(userId);

        if (!isPatient && !isDoctor) {
            throw new IllegalArgumentException("You are not authorized to cancel this appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Appointment is already " + appointment.getStatus());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepo.save(appointment);

        // Queue cancellation notification (email + delete calendar event)
        notificationService.queueCancellationNotification(appointment);

        log.info("Appointment CANCELLED: id={}, by user={}", appointmentId, userId);

        return toResponse(appointment);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  COMPLETE APPOINTMENT (Doctor marks visit as done)
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional
    public AppointmentResponse completeAppointment(UUID appointmentId, UUID doctorUserId) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (!appointment.getDoctor().getUser().getId().equals(doctorUserId)) {
            throw new IllegalArgumentException("Only the assigned doctor can complete this appointment");
        }

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED appointments can be completed");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepo.save(appointment);

        log.info("Appointment COMPLETED: id={}", appointmentId);
        return toResponse(appointment);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SUBMIT DOCTOR NOTES + PRESCRIPTIONS (post-visit)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Doctor submits clinical notes and prescriptions after a visit.
     * Triggers the LLM post-visit patient-friendly summary.
     */
    @Transactional
    public AppointmentResponse submitNotes(UUID appointmentId, UUID doctorUserId,
                                            SubmitNotesRequest request) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (!appointment.getDoctor().getUser().getId().equals(doctorUserId)) {
            throw new IllegalArgumentException("Only the assigned doctor can submit notes");
        }

        // Save visit notes
        VisitNote visitNote = VisitNote.builder()
                .appointment(appointment)
                .clinicalNotes(request.getClinicalNotes())
                .llmStatus(VisitNote.LlmStatus.PENDING)
                .build();
        visitNoteRepo.save(visitNote);

        // Save prescriptions
        if (request.getPrescriptions() != null) {
            for (SubmitNotesRequest.PrescriptionEntry entry : request.getPrescriptions()) {
                Prescription prescription = Prescription.builder()
                        .visitNote(visitNote)
                        .medicineName(entry.getMedicineName())
                        .dosage(entry.getDosage())
                        .frequency(entry.getFrequency())
                        .durationDays(entry.getDurationDays())
                        .build();
                prescriptionRepo.save(prescription);

                // Schedule medication reminders based on frequency + duration
                reminderScheduler.scheduleReminders(prescription);
            }
        }

        // Mark appointment as COMPLETED if still CONFIRMED
        if (appointment.getStatus() == AppointmentStatus.CONFIRMED) {
            appointment.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepo.save(appointment);
        }

        // Trigger async LLM post-visit summary (off critical path)
        llmClientService.generatePostVisitSummary(visitNote.getId());

        // Queue post-visit summary email to patient
        notificationService.queuePostVisitSummary(appointment);

        log.info("Visit notes submitted for appointment={}", appointmentId);
        return toResponse(appointment);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /** Patient's own appointment history */
    public List<AppointmentResponse> getPatientAppointments(UUID patientId) {
        return appointmentRepo.findByPatientIdOrderByApptDateDesc(patientId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Doctor's schedule for a specific date */
    public List<AppointmentResponse> getDoctorSchedule(UUID doctorProfileId, java.time.LocalDate date) {
        return appointmentRepo.findByDoctorIdAndApptDateOrderByStartTime(doctorProfileId, date)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Single appointment detail */
    public AppointmentResponse getAppointment(UUID appointmentId) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
        return toResponse(appointment);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RESPONSE MAPPER
    // ═══════════════════════════════════════════════════════════════════════

    private AppointmentResponse toResponse(Appointment appointment) {
        AppointmentResponse.AppointmentResponseBuilder builder = AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .doctorProfileId(appointment.getDoctor().getId())
                .date(appointment.getApptDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus().name())
                .holdExpiresAt(appointment.getHoldExpiresAt());

        // Safely load names (may be lazy-loaded)
        try {
            builder.patientName(appointment.getPatient().getName());
        } catch (Exception e) { /* lazy init — skip */ }

        try {
            builder.doctorName(appointment.getDoctor().getUser().getName());
            builder.specialisation(appointment.getDoctor().getSpecialisation());
        } catch (Exception e) { /* lazy init — skip */ }

        // Attach symptom summary if available
        if (appointment.getSymptomForm() != null) {
            SymptomForm sf = appointment.getSymptomForm();
            builder.symptomSummary(AppointmentResponse.SymptomSummary.builder()
                    .symptomsRaw(sf.getSymptomsRaw())
                    .urgencyLevel(sf.getUrgencyLevel() != null ? sf.getUrgencyLevel().name() : null)
                    .chiefComplaint(sf.getChiefComplaint())
                    .suggestedQuestions(sf.getSuggestedQuestions())
                    .llmStatus(sf.getLlmStatus().name())
                    .build());
        }

        // Attach visit summary if available
        if (appointment.getVisitNote() != null) {
            VisitNote vn = appointment.getVisitNote();
            builder.visitSummary(AppointmentResponse.VisitSummary.builder()
                    .clinicalNotes(vn.getClinicalNotes())
                    .patientSummary(vn.getPatientSummary())
                    .llmStatus(vn.getLlmStatus().name())
                    .build());
        }

        return builder.build();
    }
}
