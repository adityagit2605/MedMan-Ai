package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for doctor profile — used in search results and detail views.
 * Intentionally hides password, refresh token, etc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private UUID doctorProfileId;
    private UUID userId;
    private String name;
    private String email;
    private String phone;
    private String specialisation;
    private Integer slotDurationMinutes;
    private String bio;
    private List<WorkingHourSlot> workingHours;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkingHourSlot {
        private Integer dayOfWeek;
        private String  dayName;     // "Monday", "Tuesday", ...
        private LocalTime startTime;
        private LocalTime endTime;
    }
}
