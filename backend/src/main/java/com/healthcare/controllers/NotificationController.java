package com.healthcare.controllers;

import com.healthcare.models.User;
import com.healthcare.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Notification history endpoint.
 *
 * GET /api/notifications → returns all notifications for the authenticated user
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getMyNotifications(
            @AuthenticationPrincipal User user) {

        var notifications = notificationRepo.findByUserIdOrderByCreatedAtDesc(user.getId());

        List<Map<String, Object>> response = notifications.stream()
                .map(n -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id",        n.getId());
                    map.put("type",      n.getType().name());
                    map.put("channel",   n.getChannel().name());
                    map.put("status",    n.getStatus().name());
                    map.put("createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
                    map.put("sentAt",    n.getSentAt() != null ? n.getSentAt().toString() : null);
                    if (n.getAppointment() != null) {
                        map.put("appointmentId", n.getAppointment().getId());
                    }
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
