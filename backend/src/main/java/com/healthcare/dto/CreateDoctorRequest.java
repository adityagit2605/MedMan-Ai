package com.healthcare.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * Request body for POST /api/admin/doctors
 * Admin creates a doctor user + profile + working hours in a single call.
 */
@Data
public class CreateDoctorRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String phone;

    @NotBlank(message = "Specialisation is required")
    private String specialisation;

    @NotNull(message = "Slot duration is required")
    @Min(value = 10, message = "Slot duration must be at least 10 minutes")
    @Max(value = 120, message = "Slot duration must not exceed 120 minutes")
    private Integer slotDurationMinutes;

    private String bio;

    @Valid
    private List<WorkingHourEntry> workingHours;

    @Data
    public static class WorkingHourEntry {
        @NotNull @Min(0) @Max(6)
        private Integer dayOfWeek;

        @NotBlank
        private String startTime;  // "09:00"

        @NotBlank
        private String endTime;    // "17:00"
    }
}
