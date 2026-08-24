package com.healthcare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Request body for POST /api/appointments/hold
 *
 * Patient selects a specific doctor + date + start time.
 * The system validates, acquires a Redis lock, inserts a HELD row,
 * and returns within 5 seconds or rejects with 409.
 */
@Data
public class HoldSlotRequest {

    @NotNull(message = "Doctor profile ID is required")
    private UUID doctorId;

    @NotNull(message = "Appointment date is required")
    private LocalDate date;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;
}
