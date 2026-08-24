package com.healthcare.services;

import com.healthcare.models.*;
import com.healthcare.models.Notification.*;
import com.healthcare.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates notification outbox rows for all system events.
 *
 * Every email/calendar action is a row in the notifications table first.
 * The background NotificationWorkerJob picks up PENDING rows and sends them.
 * This decouples "the booking succeeded" from "the email was sent." (LLD §2.6)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;

    /**
     * Queue a booking confirmation notification (email + calendar).
     */
    @Transactional
    public void queueBookingConfirmation(Appointment appointment) {
        // Email to patient
        createNotification(
                appointment.getPatient(),
                appointment,
                NotificationType.BOOKING_CONFIRMATION,
                NotificationChannel.EMAIL
        );

        // Email to doctor
        createNotification(
                appointment.getDoctor().getUser(),
                appointment,
                NotificationType.BOOKING_CONFIRMATION,
                NotificationChannel.EMAIL
        );

        // Calendar events (if users have connected Google Calendar)
        if (appointment.getPatient().getGcalRefreshToken() != null) {
            createNotification(
                    appointment.getPatient(),
                    appointment,
                    NotificationType.BOOKING_CONFIRMATION,
                    NotificationChannel.CALENDAR
            );
        }
        if (appointment.getDoctor().getUser().getGcalRefreshToken() != null) {
            createNotification(
                    appointment.getDoctor().getUser(),
                    appointment,
                    NotificationType.BOOKING_CONFIRMATION,
                    NotificationChannel.CALENDAR
            );
        }

        log.info("Queued booking confirmation notifications for appointment={}",
                appointment.getId());
    }

    /**
     * Queue a cancellation notification (email + delete calendar event).
     */
    @Transactional
    public void queueCancellationNotification(Appointment appointment) {
        createNotification(
                appointment.getPatient(),
                appointment,
                NotificationType.CANCELLATION,
                NotificationChannel.EMAIL
        );
        createNotification(
                appointment.getDoctor().getUser(),
                appointment,
                NotificationType.CANCELLATION,
                NotificationChannel.EMAIL
        );

        log.info("Queued cancellation notifications for appointment={}", appointment.getId());
    }

    /**
     * Queue a leave-conflict notification to the patient.
     */
    @Transactional
    public void queueLeaveConflictNotification(Appointment appointment) {
        createNotification(
                appointment.getPatient(),
                appointment,
                NotificationType.LEAVE_CONFLICT,
                NotificationChannel.EMAIL
        );

        log.info("Queued leave-conflict notification for appointment={}", appointment.getId());
    }

    /**
     * Queue a 24-hour reminder email to the patient.
     */
    @Transactional
    public void queueAppointmentReminder(Appointment appointment) {
        createNotification(
                appointment.getPatient(),
                appointment,
                NotificationType.REMINDER_24H,
                NotificationChannel.EMAIL
        );

        log.info("Queued 24h reminder for appointment={}", appointment.getId());
    }

    /**
     * Queue a post-visit summary email to the patient.
     */
    @Transactional
    public void queuePostVisitSummary(Appointment appointment) {
        createNotification(
                appointment.getPatient(),
                appointment,
                NotificationType.POST_VISIT_SUMMARY,
                NotificationChannel.EMAIL
        );

        log.info("Queued post-visit summary notification for appointment={}", appointment.getId());
    }

    // ── Internal ──────────────────────────────────────────────────────────

    private void createNotification(User user, Appointment appointment,
                                     NotificationType type, NotificationChannel channel) {
        Notification notification = Notification.builder()
                .user(user)
                .appointment(appointment)
                .type(type)
                .channel(channel)
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .build();

        notificationRepo.save(notification);
    }
}
