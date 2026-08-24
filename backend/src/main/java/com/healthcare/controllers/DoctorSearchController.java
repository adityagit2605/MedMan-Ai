package com.healthcare.controllers;

import com.healthcare.dto.*;
import com.healthcare.models.User;
import com.healthcare.services.AdminService;
import com.healthcare.services.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Public doctor search and slot availability endpoints.
 *
 * GET /api/doctors              → search by specialisation (patient/admin)
 * GET /api/doctors/:id          → doctor detail (patient/admin)
 * GET /api/doctors/:id/slots    → available slots for a date (patient)
 */
@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorSearchController {

    private final AdminService adminService;
    private final SlotService  slotService;

    /**
     * Search doctors by specialisation.
     * If no query param, returns all doctors.
     *
     * GET /api/doctors?specialisation=Cardiology
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<List<DoctorResponse>> searchDoctors(
            @RequestParam(required = false) String specialisation) {
        return ResponseEntity.ok(adminService.searchDoctors(specialisation));
    }

    /**
     * Get a single doctor's profile (for the patient detail view).
     *
     * GET /api/doctors/:id
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<DoctorResponse> getDoctorDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getDoctor(id));
    }

    /**
     * Get available slots for a doctor on a given date.
     * This is the Slot Engine's primary API.
     *
     * GET /api/doctors/:id/slots?date=2025-09-15
     *
     * Returns only free (bookable) slots. The frontend renders these as clickable
     * time blocks. Clicking one triggers POST /api/appointments/hold.
     */
    @GetMapping("/{id}/slots")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<AvailableSlotsResponse> getAvailableSlots(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(slotService.getAvailableSlots(id, date));
    }
}
