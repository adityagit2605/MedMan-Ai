package com.healthcare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request body for POST /api/admin/doctors/:id/leaves
 */
@Data
public class CreateLeaveRequest {

    @NotNull(message = "Leave date is required")
    private LocalDate leaveDate;

    private String reason;
}
