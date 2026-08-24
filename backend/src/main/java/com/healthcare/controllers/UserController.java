package com.healthcare.controllers;

import com.healthcare.models.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Demonstrates RBAC using @PreAuthorize.
 * Returns the currently authenticated user's profile.
 *
 * Any authenticated role can call GET /api/users/me.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    /** Get the authenticated user's own profile. */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of(
                "id",    user.getId(),
                "name",  user.getName(),
                "email", user.getEmail(),
                "role",  user.getRole()
        ));
    }
}
