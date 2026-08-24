package com.healthcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response body for login and register endpoints.
 * accessToken  → short-lived (15 min), sent in JSON body
 * refreshToken → long-lived (7 days), also returned here for client storage
 *                (in a production setup this would be an httpOnly cookie)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String  accessToken;
    private String  refreshToken;
    private UUID    userId;
    private String  email;
    private String  role;
    private String  name;
}
