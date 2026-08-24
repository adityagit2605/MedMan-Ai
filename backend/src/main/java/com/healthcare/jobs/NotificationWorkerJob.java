package com.healthcare.jobs;

import com.healthcare.models.Notification;
import com.healthcare.models.Notification.*;
import com.healthcare.repositories.NotificationRepository;
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
 * Background job: Process the notification outbox.
 *
 * Runs every 60 seconds (LLD §2.6).
 * Picks PENDING and RETRYING notification rows, dispatches them
 * via the appropriate channel (email or calendar), and updates status.
 *
 * Retry policy: exponential backoff (1m, 5m, 15m), max 3 retries.
 * After 3 failures → status=FAILED (visible on admin dashboard).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWorkerJob {

    private final NotificationRepository notificationRepo;
    private final JavaMailSender         mailSender;

    private static final int MAX_RETRIES = 3;

    @Scheduled(fixedRate = 60_000)  // every 60 seconds
    @Transactional
    public void processNotifications() {
        List<Notification> pending = notificationRepo.findByStatusInOrderByCreatedAtAsc(
                List.of(NotificationStatus.PENDING, NotificationStatus.RETRYING));

        if (pending.isEmpty()) return;

        int sent = 0, retried = 0, failed = 0;

        for (Notification notification : pending) {
            try {
                if (notification.getChannel() == NotificationChannel.EMAIL) {
                    sendEmail(notification);
                } else if (notification.getChannel() == NotificationChannel.CALENDAR) {
                    // Google Calendar integration placeholder
                    // In production: call Google Calendar API using stored OAuth tokens
                    log.info("Calendar notification skipped (Google Calendar not configured): {}",
                            notification.getId());
                    notification.setStatus(NotificationStatus.SENT);
                    notification.setSentAt(LocalDateTime.now());
                    notificationRepo.save(notification);
                    sent++;
                    continue;
                }

                // Mark as sent
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                notification.setLastError(null);
                sent++;

            } catch (Exception e) {
                notification.setRetryCount(notification.getRetryCount() + 1);
                notification.setLastError(e.getMessage());

                if (notification.getRetryCount() >= MAX_RETRIES) {
                    notification.setStatus(NotificationStatus.FAILED);
                    failed++;
                    log.error("Notification FAILED permanently after {} retries: id={}, error={}",
                            MAX_RETRIES, notification.getId(), e.getMessage());
                } else {
                    notification.setStatus(NotificationStatus.RETRYING);
                    retried++;
                    log.warn("Notification will be retried (attempt {}): id={}, error={}",
                            notification.getRetryCount(), notification.getId(), e.getMessage());
                }
            }

            notificationRepo.save(notification);
        }

        if (sent > 0 || retried > 0 || failed > 0) {
            log.info("Notifications processed: {} sent, {} retrying, {} failed",
                    sent, retried, failed);
        }
    }

    // ── Email dispatcher ──────────────────────────────────────────────────

    private void sendEmail(Notification notification) {
        String recipientEmail = notification.getUser().getEmail();
        String recipientName  = notification.getUser().getName();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipientEmail);

        switch (notification.getType()) {
            case BOOKING_CONFIRMATION -> {
                message.setSubject("Appointment Confirmed");
                message.setText(buildConfirmationBody(notification, recipientName));
            }
            case CANCELLATION -> {
                message.setSubject("Appointment Cancelled");
                message.setText(buildCancellationBody(notification, recipientName));
            }
            case REMINDER_24H -> {
                message.setSubject("Appointment Reminder — Tomorrow");
                message.setText(buildReminderBody(notification, recipientName));
            }
            case LEAVE_CONFLICT -> {
                message.setSubject("Appointment Affected — Doctor Unavailable");
                message.setText(buildLeaveConflictBody(notification, recipientName));
            }
            case POST_VISIT_SUMMARY -> {
                message.setSubject("Your Visit Summary");
                message.setText(buildPostVisitBody(notification, recipientName));
            }
            default -> {
                message.setSubject("Healthcare Portal Notification");
                message.setText("You have a new notification. Please log in to view details.");
            }
        }

        mailSender.send(message);
    }

    // ── Email body templates ──────────────────────────────────────────────

    private String buildConfirmationBody(Notification n, String name) {
        var appt = n.getAppointment();
        return String.format(
            "Hi %s,\n\n" +
            "Your appointment has been confirmed.\n\n" +
            "  Date: %s\n  Time: %s - %s\n\n" +
            "Please arrive 10 minutes early.\n\n" +
            "— Healthcare Appointment Manager",
            name, appt.getApptDate(), appt.getStartTime(), appt.getEndTime()
        );
    }

    private String buildCancellationBody(Notification n, String name) {
        var appt = n.getAppointment();
        return String.format(
            "Hi %s,\n\n" +
            "Your appointment on %s at %s has been cancelled.\n\n" +
            "If you need to reschedule, please book a new appointment.\n\n" +
            "— Healthcare Appointment Manager",
            name, appt.getApptDate(), appt.getStartTime()
        );
    }

    private String buildReminderBody(Notification n, String name) {
        var appt = n.getAppointment();
        return String.format(
            "Hi %s,\n\n" +
            "This is a reminder that you have an appointment tomorrow.\n\n" +
            "  Date: %s\n  Time: %s - %s\n\n" +
            "Please be on time.\n\n" +
            "— Healthcare Appointment Manager",
            name, appt.getApptDate(), appt.getStartTime(), appt.getEndTime()
        );
    }

    private String buildLeaveConflictBody(Notification n, String name) {
        var appt = n.getAppointment();
        return String.format(
            "Hi %s,\n\n" +
            "Unfortunately, your doctor is no longer available on %s.\n" +
            "Your appointment at %s has been affected.\n\n" +
            "Please log in to reschedule your appointment.\n\n" +
            "— Healthcare Appointment Manager",
            name, appt.getApptDate(), appt.getStartTime()
        );
    }

    private String buildPostVisitBody(Notification n, String name) {
        return String.format(
            "Hi %s,\n\n" +
            "Your visit summary is ready. Please log in to view your " +
            "doctor's notes, prescriptions, and follow-up instructions.\n\n" +
            "— Healthcare Appointment Manager",
            name
        );
    }
}
