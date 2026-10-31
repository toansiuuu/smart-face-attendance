package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;

public record ChallengeEnrollmentRequest(@NotBlank @Size(min = 20, max = 64) String challengeId) {}
