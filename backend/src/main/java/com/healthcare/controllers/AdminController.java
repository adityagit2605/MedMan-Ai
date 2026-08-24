package com.healthcare.controllers;

import com.healthcare.dto.*;
import com.healthcare.services.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Admin-only endpoints for managing doctors, working hours, and leaves.
 *
 * All endpoints require ROLE_ADMIN (enforced both at URL level in SecurityConfig
 * and at method level with @PreAuthorize for defense in depth).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ── Doctor CRUD ──────────────────────────────────────────────────────

    /** Create a new doctor (user + profile + working hours in one call). */
    @PostMapping("/doctors")
    public ResponseEntity<DoctorResponse> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        DoctorResponse response = adminService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Update doctor profile and/or working hours (partial update). */
    @PatchMapping("/doctors/{id}")
    public ResponseEntity<DoctorResponse> updateDoctor(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDoctorRequest request) {
        return ResponseEntity.ok(adminService.updateDoctor(id, request));
    }

    /** Get a single doctor's full profile. */
    @GetMapping("/doctors/{id}")
    public ResponseEntity<DoctorResponse> getDoctor(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getDoctor(id));
    }

    /** List all doctors. */
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        return ResponseEntity.ok(adminService.getAllDoctors());
    }

    // ── Leave management ─────────────────────────────────────────────────

    /**
     * Mark a doctor on leave for a date.
     * Triggers the leave-conflict handler (LLD §2.4):
     *   - Finds affected HELD/CONFIRMED appointments
     *   - Sets them to LEAVE_CONFLICT
     *   - Queues patient notifications
     */
    @PostMapping("/doctors/{id}/leaves")
    public ResponseEntity<Map<String, Object>> markLeave(
            @PathVariable UUID id,
            @Valid @RequestBody CreateLeaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.markLeave(id, request));
    }

    /** List all leaves for a doctor. */
    @GetMapping("/doctors/{id}/leaves")
    public ResponseEntity<List<Map<String, Object>>> getDoctorLeaves(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getDoctorLeaves(id));
    }
}
