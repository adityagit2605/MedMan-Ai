package com.healthcare.repositories;

import com.healthcare.models.DoctorWorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DoctorWorkingHoursRepository extends JpaRepository<DoctorWorkingHours, UUID> {

    List<DoctorWorkingHours> findByDoctorProfileIdOrderByDayOfWeek(UUID doctorProfileId);

    DoctorWorkingHours findByDoctorProfileIdAndDayOfWeek(UUID doctorProfileId, Integer dayOfWeek);

    void deleteByDoctorProfileId(UUID doctorProfileId);
}
