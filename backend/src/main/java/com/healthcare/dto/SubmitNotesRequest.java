package com.healthcare.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

/**
 * Request body for POST /api/appointments/:id/notes
 * Doctor submits clinical notes + prescriptions after a visit.
 * Triggers the LLM post-visit summary asynchronously.
 */
@Data
public class SubmitNotesRequest {

    @NotBlank(message = "Clinical notes are required")
    private String clinicalNotes;

    @Valid
    private List<PrescriptionEntry> prescriptions;

    @Data
    public static class PrescriptionEntry {
        @NotBlank(message = "Medicine name is required")
        private String medicineName;

        @NotBlank(message = "Dosage is required")
        private String dosage;

        @NotBlank(message = "Frequency is required")
        private String frequency;  // "1-0-1", "every 8h"

        @NotNull(message = "Duration in days is required")
        @Min(value = 1, message = "Duration must be at least 1 day")
        private Integer durationDays;
    }
}
