package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record CorrectionRequest(
    @NotNull LocalDate workDate,
    @NotBlank String eventType,
    @NotNull LocalTime requestedTime,
    @NotBlank @Size(max = 4000) String reason) {}
