package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record CorrectionRequest(
    @NotNull LocalDate workDate,
    @NotBlank @Pattern(regexp = "MORNING_IN|LUNCH_OUT|AFTERNOON_IN|WORK_OUT") String eventType,
    @NotNull LocalTime requestedTime,
    @NotBlank @Size(min = 5, max = 4000) String reason) {}
