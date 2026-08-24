package com.healthcare.repositories;

import com.healthcare.models.DoctorLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DoctorLeaveRepository extends JpaRepository<DoctorLeave, UUID> {

    List<DoctorLeave> findByDoctorProfileIdOrderByLeaveDate(UUID doctorProfileId);

    boolean existsByDoctorProfileIdAndLeaveDate(UUID doctorProfileId, LocalDate leaveDate);

    List<DoctorLeave> findByDoctorProfileIdAndLeaveDateBetween(
            UUID doctorProfileId, LocalDate startDate, LocalDate endDate);
}
