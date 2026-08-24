package com.healthcare.jobs;

import com.healthcare.models.Appointment;
import com.healthcare.repositories.AppointmentRepository;
import com.healthcare.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Background job: Send 24-hour appointment reminders.
 *
 * Runs every 15 minutes (LLD §2.7).
 * Finds CONFIRMED appointments scheduled for tomorrow and
 * queues reminder email notifications via the outbox.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderJob {

    private final AppointmentRepository appointmentRepo;
    private final NotificationService   notificationService;

    @Scheduled(fixedRate = 900_000)  // every 15 minutes
    @Transactional
    public void sendReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Appointment> upcoming = appointmentRepo.findConfirmedAppointmentsOnDate(tomorrow);

        if (upcoming.isEmpty()) return;

        for (Appointment appt : upcoming) {
            try {
                notificationService.queueAppointmentReminder(appt);
            } catch (Exception e) {
                log.error("Failed to queue 24h reminder for appointment={}: {}",
                        appt.getId(), e.getMessage());
            }
        }

        log.info("Queued {} 24h appointment reminder(s) for {}", upcoming.size(), tomorrow);
    }
}
