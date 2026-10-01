package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record PasswordRequest(
    @NotBlank String currentPassword, @NotBlank @Size(min = 12, max = 72) String newPassword) {}
