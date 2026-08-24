package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a doctor's leave day.
 * When a leave is inserted, the Leave Conflict Handler checks
 * for existing confirmed/held appointments on that date and triggers
 * notifications (see LLD section 2.4).
 */
@Entity
@Table(name = "doctor_leaves",
        uniqueConstraints = @UniqueConstraint(columnNames = {"doctor_id", "leave_date"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoctorLeave {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorProfile doctorProfile;

    @Column(name = "leave_date", nullable = false)
    private LocalDate leaveDate;

    private String reason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
