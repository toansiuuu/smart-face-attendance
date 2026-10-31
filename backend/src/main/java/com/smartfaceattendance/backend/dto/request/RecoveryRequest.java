package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;

public record RecoveryRequest(
    @NotBlank @Size(max = 80) String username,
    @NotBlank @Pattern(regexp = "EMAIL|SMS") String channel,
    @NotBlank @Size(max = 254) String contact) {}
