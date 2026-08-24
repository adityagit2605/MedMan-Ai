package com.healthcare.repositories;

import com.healthcare.models.Appointment;
import com.healthcare.models.Appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    /**
     * All appointments for a given doctor on a specific date that are ACTIVE
     * (either HELD or CONFIRMED) — used by the slot engine to compute free slots.
     */
    @Query("""
        SELECT a FROM Appointment a
        WHERE a.doctor.id = :doctorId
          AND a.apptDate  = :date
          AND a.status IN ('HELD', 'CONFIRMED')
        """)
    List<Appointment> findActiveByDoctorAndDate(
            @Param("doctorId") UUID doctorId,
            @Param("date")     LocalDate date);

    /**
     * Expired HELD slots — for the background cleanup job.
     */
    @Query("""
        SELECT a FROM Appointment a
        WHERE a.status         = 'HELD'
          AND a.holdExpiresAt < :now
        """)
    List<Appointment> findExpiredHolds(@Param("now") LocalDateTime now);

    /**
     * Appointments on a specific date for conflict handling when a doctor leave is added.
     */
    @Query("""
        SELECT a FROM Appointment a
        WHERE a.doctor.id  = :doctorId
          AND a.apptDate   = :date
          AND a.status IN ('HELD', 'CONFIRMED')
        """)
    List<Appointment> findConflictingAppointments(
            @Param("doctorId") UUID doctorId,
            @Param("date")     LocalDate date);

    /**
     * Patient's own appointment history.
     */
    List<Appointment> findByPatientIdOrderByApptDateDesc(UUID patientId);

    /**
     * Doctor's schedule for a given date.
     */
    List<Appointment> findByDoctorIdAndApptDateOrderByStartTime(UUID doctorId, LocalDate date);

    /**
     * Appointments scheduled 24 hours from now (for reminder emails).
     */
    @Query("""
        SELECT a FROM Appointment a
        WHERE a.status   = 'CONFIRMED'
          AND a.apptDate = :targetDate
        """)
    List<Appointment> findConfirmedAppointmentsOnDate(@Param("targetDate") LocalDate targetDate);
}
