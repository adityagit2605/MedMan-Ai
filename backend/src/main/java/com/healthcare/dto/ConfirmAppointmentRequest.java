package com.healthcare.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for POST /api/appointments/:id/confirm
 * Patient submits their symptom form along with confirmation.
 */
@Data
public class ConfirmAppointmentRequest {

    @NotBlank(message = "Symptoms description is required")
    private String symptoms;
}
