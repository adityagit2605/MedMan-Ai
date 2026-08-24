package com.healthcare.jobs;

import com.healthcare.models.MedicationReminder;
import com.healthcare.models.MedicationReminder.ReminderStatus;
import com.healthcare.repositories.MedicationReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background job: Send due medication reminders.
 *
 * Runs every 5 minutes (LLD §2.7).
 * Picks reminders where scheduled_at <= now AND status = PENDING,
 * sends an email, and updates the status to SENT or FAILED.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MedicationReminderSenderJob {

    private final MedicationReminderRepository reminderRepo;
    private final JavaMailSender               mailSender;

    @Scheduled(fixedRate = 300_000)  // every 5 minutes
    @Transactional
    public void sendDueReminders() {
        List<MedicationReminder> due = reminderRepo.findDueReminders(LocalDateTime.now());

        if (due.isEmpty()) return;

        int sent = 0, failed = 0;

        for (MedicationReminder reminder : due) {
            try {
                // Build email
                String patientEmail = reminder.getPrescription()
                        .getVisitNote()
                        .getAppointment()
                        .getPatient()
                        .getEmail();

                String medicineName = reminder.getPrescription().getMedicineName();
                String dosage       = reminder.getPrescription().getDosage();

                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(patientEmail);
                message.setSubject("Medication Reminder: " + medicineName);
                message.setText(String.format(
                        "Hi,\n\nThis is a reminder to take your medication:\n\n" +
                        "  Medicine: %s\n  Dosage: %s\n\n" +
                        "Please take it as prescribed by your doctor.\n\n" +
                        "— Healthcare Appointment Manager",
                        medicineName, dosage
                ));

                mailSender.send(message);

                reminder.setStatus(ReminderStatus.SENT);
                sent++;

            } catch (Exception e) {
                reminder.setRetryCount(reminder.getRetryCount() + 1);
                if (reminder.getRetryCount() >= 3) {
                    reminder.setStatus(ReminderStatus.FAILED);
                    failed++;
                }
                log.error("Failed to send medication reminder={}: {}",
                        reminder.getId(), e.getMessage());
            }

            reminderRepo.save(reminder);
        }

        log.info("Medication reminders processed: {} sent, {} failed, {} total",
                sent, failed, due.size());
    }
}
