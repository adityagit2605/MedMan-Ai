package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Each row represents a single scheduled medication reminder for the patient.
 * Created in bulk by MedicationReminderScheduler when a prescription is saved.
 * Processed by the send-medication-reminders background job (every 5 min).
 */
@Entity
@Table(name = "medication_reminders",
        indexes = {
            @Index(name = "idx_med_reminder_scheduled", columnList = "scheduled_at, status")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicationReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    /** Exact timestamp when this reminder should be sent */
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderStatus status;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = ReminderStatus.PENDING;
        if (retryCount == null) retryCount = 0;
    }

    public enum ReminderStatus { PENDING, SENT, FAILED }
}
