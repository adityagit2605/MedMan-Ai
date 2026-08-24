package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Core booking entity.
 *
 * Status lifecycle:
 *   HELD → (within 5 min) → CONFIRMED → COMPLETED
 *                         → CANCELLED
 *   CONFIRMED → LEAVE_CONFLICT → patient reschedules → new HELD/CONFIRMED
 *
 * Double-booking is prevented by:
 *  1. Redis distributed lock (fast path — see RedisLockService)
 *  2. Partial unique index on (doctor_id, appt_date, start_time) WHERE status IN ('HELD','CONFIRMED')
 */
@Entity
@Table(name = "appointments",
        indexes = {
            @Index(name = "idx_appt_doctor_date", columnList = "doctor_id, appt_date"),
            @Index(name = "idx_appt_patient",     columnList = "patient_id"),
            @Index(name = "idx_appt_status",       columnList = "status")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** The patient who booked */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    /** The doctor being visited */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorProfile doctor;

    @Column(name = "appt_date", nullable = false)
    private LocalDate apptDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    /** Set when status = HELD; background job clears expired holds */
    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    /** Google Calendar event ID for the patient's calendar */
    @Column(name = "gcal_event_id_patient")
    private String gcalEventIdPatient;

    /** Google Calendar event ID for the doctor's calendar */
    @Column(name = "gcal_event_id_doctor")
    private String gcalEventIdDoctor;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────────────────

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SymptomForm symptomForm;

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private VisitNote visitNote;

    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL)
    private List<Notification> notifications;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Status enum ────────────────────────────────────────────────────────
    public enum AppointmentStatus {
        HELD, CONFIRMED, CANCELLED, COMPLETED, LEAVE_CONFLICT, CANCELLED_RESCHEDULED
    }
}
