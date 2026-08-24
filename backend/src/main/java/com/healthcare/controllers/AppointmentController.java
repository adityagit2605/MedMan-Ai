package com.healthcare.controllers;

import com.healthcare.dto.*;
import com.healthcare.models.User;
import com.healthcare.services.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Appointment lifecycle endpoints — the core booking flow.
 *
 * POST /api/appointments/hold          → Patient holds a slot (5 min window)
 * POST /api/appointments/:id/confirm   → Patient confirms + submits symptoms
 * POST /api/appointments/:id/cancel    → Patient or doctor cancels
 * POST /api/appointments/:id/complete  → Doctor marks as done
 * POST /api/appointments/:id/notes     → Doctor submits clinical notes + prescriptions
 * GET  /api/appointments/my            → Patient's own history
 * GET  /api/appointments/:id           → Single appointment detail
 */
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // ═══════════════════════════════════════════════════════════════════════
    //  BOOKING FLOW
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Step 1: Hold a slot.
     *
     * Acquires a Redis distributed lock, inserts a HELD row with a 5-minute expiry.
     * If the slot is already taken, returns 409 Conflict.
     */
    @PostMapping("/hold")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> holdSlot(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody HoldSlotRequest request) {
        try {
            AppointmentResponse response = appointmentService.holdSlot(patient.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            // Slot unavailable or Redis lock denied → 409 Conflict
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Step 2: Confirm the held appointment.
     *
     * Patient must submit their symptom description to confirm.
     * Must be called within the hold window (default 5 min), otherwise
     * the hold expires and the slot is released.
     *
     * Async side-effects:
     *   - LLM pre-visit summary is triggered
     *   - Booking confirmation email + Google Calendar event queued
     */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> confirmAppointment(
            @PathVariable UUID id,
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ConfirmAppointmentRequest request) {
        try {
            return ResponseEntity.ok(appointmentService.confirmAppointment(id, patient.getId(), request));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Cancel an appointment.
     *
     * Both patients and doctors can cancel. Authorization is checked
     * inside the service (must be either the patient who booked or the
     * assigned doctor).
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, user.getId()));
    }

    /**
     * Doctor marks an appointment as COMPLETED (visit done).
     */
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable UUID id,
            @AuthenticationPrincipal User doctor) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id, doctor.getId()));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DOCTOR NOTES + PRESCRIPTIONS (post-visit)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Doctor submits clinical notes and prescriptions after the visit.
     *
     * Async side-effects:
     *   - LLM post-visit patient-friendly summary triggered
     *   - Medication reminders scheduled based on prescription frequency
     *   - Post-visit summary email queued to patient
     */
    @PostMapping("/{id}/notes")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponse> submitNotes(
            @PathVariable UUID id,
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody SubmitNotesRequest request) {
        return ResponseEntity.ok(appointmentService.submitNotes(id, doctor.getId(), request));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Patient's own appointment history (past + upcoming).
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal User patient) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patient.getId()));
    }

    /**
     * Single appointment detail (patient sees their own, doctor sees their schedule).
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppointmentResponse> getAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointment(id));
    }
}
