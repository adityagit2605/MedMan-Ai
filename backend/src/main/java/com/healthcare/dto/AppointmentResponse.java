package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Response DTO for appointment operations (hold, confirm, cancel, list).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private UUID   id;
    private UUID   patientId;
    private String patientName;
    private UUID   doctorProfileId;
    private String doctorName;
    private String specialisation;

    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    private String status;
    private LocalDateTime holdExpiresAt;

    private SymptomSummary symptomSummary;
    private VisitSummary   visitSummary;

    /**
     * Pre-visit LLM summary (if available).
     * Null when llmStatus != SUCCESS → frontend shows raw symptoms.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymptomSummary {
        private String symptomsRaw;
        private String urgencyLevel;
        private String chiefComplaint;
        private java.util.List<String> suggestedQuestions;
        private String llmStatus;
    }

    /**
     * Post-visit LLM summary (if available).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisitSummary {
        private String clinicalNotes;
        private String patientSummary;
        private String llmStatus;
    }
}
