package com.healthcare.services;

import com.healthcare.models.MedicationReminder;
import com.healthcare.models.Prescription;
import com.healthcare.repositories.MedicationReminderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses prescription frequency strings and generates MedicationReminder rows.
 *
 * Supported frequency formats:
 *   "1-0-1"    → morning (08:00) and night (20:00)
 *   "1-1-1"    → morning (08:00), afternoon (14:00), night (20:00)
 *   "0-0-1"    → night only (20:00)
 *   "1-0-0"    → morning only (08:00)
 *   "every Xh" → every X hours starting from 08:00
 *
 * Each reminder row has a scheduled_at timestamp.
 * The MedicationReminderSenderJob polls for due reminders every 5 min.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MedicationReminderScheduler {

    private final MedicationReminderRepository reminderRepo;

    /** Default reminder times for the 1-0-1 notation */
    private static final LocalTime MORNING   = LocalTime.of(8, 0);
    private static final LocalTime AFTERNOON = LocalTime.of(14, 0);
    private static final LocalTime NIGHT     = LocalTime.of(20, 0);

    /**
     * Parse the frequency string and create reminder rows for the full duration.
     *
     * Called from AppointmentService.submitNotes() after each prescription is saved.
     */
    @Transactional
    public int scheduleReminders(Prescription prescription) {
        String frequency = prescription.getFrequency().trim().toLowerCase();
        int durationDays = prescription.getDurationDays();

        List<LocalTime> dailyTimes;

        if (frequency.startsWith("every") && frequency.endsWith("h")) {
            // "every 8h" format
            dailyTimes = parseEveryXHours(frequency);
        } else if (frequency.matches("\\d-\\d-\\d")) {
            // "1-0-1" format (morning-afternoon-night)
            dailyTimes = parseDashNotation(frequency);
        } else {
            // Unknown format — default to once daily (morning)
            log.warn("Unknown frequency format '{}', defaulting to once daily", frequency);
            dailyTimes = List.of(MORNING);
        }

        // Generate reminders for each day × each daily time
        LocalDate startDate = LocalDate.now().plusDays(1); // start from tomorrow
        int count = 0;

        for (int day = 0; day < durationDays; day++) {
            LocalDate reminderDate = startDate.plusDays(day);
            for (LocalTime time : dailyTimes) {
                LocalDateTime scheduledAt = LocalDateTime.of(reminderDate, time);

                MedicationReminder reminder = MedicationReminder.builder()
                        .prescription(prescription)
                        .scheduledAt(scheduledAt)
                        .status(MedicationReminder.ReminderStatus.PENDING)
                        .retryCount(0)
                        .build();

                reminderRepo.save(reminder);
                count++;
            }
        }

        log.info("Scheduled {} medication reminders for prescription={} (frequency={}, days={})",
                count, prescription.getId(), frequency, durationDays);

        return count;
    }

    // ── Parsers ───────────────────────────────────────────────────────────

    /**
     * Parse "1-0-1" notation:
     *   position 0 = morning (08:00)
     *   position 1 = afternoon (14:00)
     *   position 2 = night (20:00)
     *   1 = take, 0 = skip
     */
    private List<LocalTime> parseDashNotation(String frequency) {
        String[] parts = frequency.split("-");
        List<LocalTime> times = new ArrayList<>();

        if (parts.length >= 1 && "1".equals(parts[0])) times.add(MORNING);
        if (parts.length >= 2 && "1".equals(parts[1])) times.add(AFTERNOON);
        if (parts.length >= 3 && "1".equals(parts[2])) times.add(NIGHT);

        if (times.isEmpty()) {
            times.add(MORNING); // fallback
        }

        return times;
    }

    /**
     * Parse "every Xh" notation → generate times from 08:00 every X hours until 22:00.
     */
    private List<LocalTime> parseEveryXHours(String frequency) {
        try {
            String numStr = frequency.replace("every", "").replace("h", "").trim();
            int hours = Integer.parseInt(numStr);

            if (hours <= 0 || hours > 24) {
                return List.of(MORNING);
            }

            List<LocalTime> times = new ArrayList<>();
            LocalTime current = MORNING;
            LocalTime cutoff = LocalTime.of(22, 0);

            while (!current.isAfter(cutoff)) {
                times.add(current);
                current = current.plusHours(hours);
                // Prevent infinite loop for edge cases
                if (current.isBefore(MORNING) && hours < 24) break;
            }

            return times.isEmpty() ? List.of(MORNING) : times;

        } catch (NumberFormatException e) {
            log.warn("Failed to parse 'every Xh' format: {}", frequency);
            return List.of(MORNING);
        }
    }
}
