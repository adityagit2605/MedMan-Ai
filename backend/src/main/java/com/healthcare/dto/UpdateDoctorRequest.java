package com.healthcare.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * Request body for PATCH /api/admin/doctors/:id
 * All fields are optional — only non-null fields are updated.
 */
@Data
public class UpdateDoctorRequest {

    private String specialisation;

    @Min(value = 10, message = "Slot duration must be at least 10 minutes")
    @Max(value = 120, message = "Slot duration must not exceed 120 minutes")
    private Integer slotDurationMinutes;

    private String bio;

    private String phone;

    /**
     * If provided, replaces all existing working hours for this doctor.
     * If null/empty, working hours are left unchanged.
     */
    @Valid
    private List<CreateDoctorRequest.WorkingHourEntry> workingHours;
}
