package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Response DTO for GET /api/doctors/:id/slots?date=YYYY-MM-DD
 * Returns the list of free bookable slots for a doctor on a given date.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotsResponse {

    private String   doctorName;
    private String   specialisation;
    private LocalDate date;
    private String   dayOfWeek;
    private Integer  slotDurationMinutes;
    private List<SlotInfo> slots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotInfo {
        private LocalTime startTime;
        private LocalTime endTime;
        private boolean   available;  // always true in this list (unavailable are excluded)
    }
}
