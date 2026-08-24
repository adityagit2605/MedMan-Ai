package com.healthcare.jobs;

import com.healthcare.models.Appointment;
import com.healthcare.models.Appointment.AppointmentStatus;
import com.healthcare.repositories.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background job: Release expired HELD appointments.
 *
 * Runs every 60 seconds (LLD §2.7).
 * Finds appointments where status=HELD and hold_expires_at < now(),
 * flips them to CANCELLED so the slot becomes available again.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExpiredHoldCleanupJob {

    private final AppointmentRepository appointmentRepo;

    @Scheduled(fixedRate = 60_000)  // every 60 seconds
    @Transactional
    public void releaseExpiredHolds() {
        List<Appointment> expired = appointmentRepo.findExpiredHolds(LocalDateTime.now());

        if (expired.isEmpty()) return;

        for (Appointment appt : expired) {
            appt.setStatus(AppointmentStatus.CANCELLED);
            appointmentRepo.save(appt);
            log.info("Expired hold released: appointment={}, was held since {}",
                    appt.getId(), appt.getCreatedAt());
        }

        log.info("Released {} expired hold(s)", expired.size());
    }
}
