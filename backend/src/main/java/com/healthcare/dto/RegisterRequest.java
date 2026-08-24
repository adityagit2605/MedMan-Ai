package com.healthcare.dto;

import com.healthcare.models.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for POST /api/auth/register
 *
 * Doctors CANNOT self-register — only PATIENT is accepted here.
 * Admin creates doctor profiles via POST /api/admin/doctors.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    /** PATIENT only (doctor registration is admin-only) */
    @NotNull(message = "Role is required")
    private User.Role role;

    private String phone;
}
