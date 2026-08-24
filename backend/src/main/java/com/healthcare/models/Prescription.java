package com.healthcare.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * A single line of prescription from a visit note.
 * One VisitNote → many Prescriptions.
 *
 * frequency examples:
 *   "1-0-1"  = morning and night
 *   "1-1-1"  = three times daily
 *   "every 8h"
 */
@Entity
@Table(name = "prescriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_note_id", nullable = false)
    private VisitNote visitNote;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(nullable = false)
    private String dosage;

    /**
     * Frequency string (e.g. "1-0-1", "every 8h").
     * The MedicationReminderScheduler parses this to generate reminder timestamps.
     */
    @Column(nullable = false)
    private String frequency;

    /** Total duration of this medication course in days */
    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    /** One prescription → many scheduled medication reminders */
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicationReminder> reminders;
}
