package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record MilestoneRequest(
    @NotBlank String eventType,
    @NotNull LocalTime targetTime,
    @NotNull LocalTime windowStart,
    @NotNull LocalTime windowEnd) {}
