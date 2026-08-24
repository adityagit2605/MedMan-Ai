package com.healthcare.repositories;

import com.healthcare.models.MedicationReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, UUID> {

    @Query("""
        SELECT mr FROM MedicationReminder mr
        WHERE mr.scheduledAt <= :now
          AND mr.status = 'PENDING'
        ORDER BY mr.scheduledAt ASC
        """)
    List<MedicationReminder> findDueReminders(@Param("now") LocalDateTime now);
}
