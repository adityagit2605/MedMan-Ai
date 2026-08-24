package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Extended profile for a doctor user.
 * One-to-one with User (where role = DOCTOR).
 * One-to-many with DoctorWorkingHours, DoctorLeave, Appointment.
 */
@Entity
@Table(name = "doctor_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** One-to-One with User */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String specialisation;

    /** Duration of each bookable slot in minutes (e.g. 15, 30, 60) */
    @Column(name = "slot_duration_minutes", nullable = false)
    private Integer slotDurationMinutes;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** One doctor → many working hour schedules (per day of week) */
    @OneToMany(mappedBy = "doctorProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorWorkingHours> workingHours;

    /** One doctor → many leave dates */
    @OneToMany(mappedBy = "doctorProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorLeave> leaves;

    /** One doctor → many appointments */
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    private List<Appointment> appointments;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
