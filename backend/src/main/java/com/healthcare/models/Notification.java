package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Outbox table for all outbound notifications (email + Google Calendar).
 * Every bookable event (confirm, cancel, reminder, leave-conflict) inserts
 * a row here first. The background worker processes pending rows and retries
 * up to 3 times with exponential backoff on failure.
 *
 * This pattern decouples booking success from notification delivery.
 */
@Entity
@Table(name = "notifications",
        indexes = {
            @Index(name = "idx_notif_status",   columnList = "status, created_at"),
            @Index(name = "idx_notif_user",     columnList = "user_id"),
            @Index(name = "idx_notif_appt",     columnList = "appointment_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** Recipient */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Associated appointment (nullable for medication reminders) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null)     status     = NotificationStatus.PENDING;
        if (retryCount == null) retryCount = 0;
    }

    // ── Enums ─────────────────────────────────────────────────────────────
    public enum NotificationType {
        BOOKING_CONFIRMATION, REMINDER_24H, CANCELLATION,
        LEAVE_CONFLICT, MEDICATION_REMINDER, POST_VISIT_SUMMARY
    }

    public enum NotificationChannel {
        EMAIL, CALENDAR
    }

    public enum NotificationStatus {
        PENDING, SENT, FAILED, RETRYING
    }
}
