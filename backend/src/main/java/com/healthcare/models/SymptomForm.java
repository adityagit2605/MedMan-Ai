package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pre-visit symptom form submitted by the patient.
 * Triggers the LLM pre-visit summary (async, off the critical path).
 * llm_status tracks the state of the async LLM call.
 */
@Entity
@Table(name = "symptom_forms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SymptomForm {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** One-to-one with Appointment */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "symptoms_raw", nullable = false, columnDefinition = "TEXT")
    private String symptomsRaw;

    /** Populated by LLM — null if llm_status != SUCCESS */
    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level")
    private UrgencyLevel urgencyLevel;

    /** Chief complaint extracted by LLM */
    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    /**
     * List of suggested questions returned by LLM, stored as JSONB.
     * Example: ["Do you have a fever?", "How long have you had pain?", ...]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "suggested_questions", columnDefinition = "jsonb")
    private List<String> suggestedQuestions;

    @Enumerated(EnumType.STRING)
    @Column(name = "llm_status", nullable = false)
    private LlmStatus llmStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (llmStatus == null) llmStatus = LlmStatus.PENDING;
        if (urgencyLevel == null) urgencyLevel = UrgencyLevel.PENDING;
    }

    public enum UrgencyLevel { LOW, MEDIUM, HIGH, PENDING }
    public enum LlmStatus    { PENDING, SUCCESS, FAILED }
}
