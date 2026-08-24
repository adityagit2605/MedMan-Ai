package com.healthcare.repositories;

import com.healthcare.models.SymptomForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SymptomFormRepository extends JpaRepository<SymptomForm, UUID> {

    Optional<SymptomForm> findByAppointmentId(UUID appointmentId);
}
