package com.healthcare.repositories;

import com.healthcare.models.VisitNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VisitNoteRepository extends JpaRepository<VisitNote, UUID> {

    Optional<VisitNote> findByAppointmentId(UUID appointmentId);
}
