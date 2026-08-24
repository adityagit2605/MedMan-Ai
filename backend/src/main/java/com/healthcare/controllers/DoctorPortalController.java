package com.healthcare.controllers;

import com.healthcare.dto.AppointmentResponse;
import com.healthcare.models.DoctorProfile;
import com.healthcare.models.User;
import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.repositories.DoctorProfileRepository;
import com.healthcare.services.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Doctor's own portal endpoints.
 *
 * GET /api/doctor/schedule?date=   → Day's appointment schedule with pre-visit summaries
 * GET /api/doctor/profile          → Own profile view
 */
@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorPortalController {

    private final AppointmentService      appointmentService;
    private final DoctorProfileRepository doctorProfileRepo;

    /**
     * Get the doctor's schedule for a given date.
     *
     * Each appointment includes:
     *   - Patient name
     *   - Symptom summary (if LLM succeeded) or raw symptoms (fallback)
     *   - Urgency level
     *   - Visit notes (if already submitted)
     *
     * GET /api/doctor/schedule?date=2025-09-15
     */
    @GetMapping("/schedule")
    public ResponseEntity<List<AppointmentResponse>> getMySchedule(
            @AuthenticationPrincipal User doctor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        DoctorProfile profile = doctorProfileRepo.findByUserId(doctor.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor profile not found for user: " + doctor.getId()));

        return ResponseEntity.ok(appointmentService.getDoctorSchedule(profile.getId(), date));
    }

    /**
     * Get the authenticated doctor's own profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal User doctor) {
        DoctorProfile profile = doctorProfileRepo.findByUserId(doctor.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Doctor profile not found for user: " + doctor.getId()));

        return ResponseEntity.ok(new java.util.LinkedHashMap<String, Object>() {{
            put("doctorProfileId", profile.getId());
            put("name", doctor.getName());
            put("email", doctor.getEmail());
            put("specialisation", profile.getSpecialisation());
            put("slotDurationMinutes", profile.getSlotDurationMinutes());
            put("bio", profile.getBio());
        }});
    }
}
