package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;

public record VerifyRecoveryCodeRequest(
    @NotBlank @Pattern(regexp = "[a-f0-9-]{36}") String requestId,
    @NotBlank @Pattern(regexp = "[0-9]{6}") String code) {}
