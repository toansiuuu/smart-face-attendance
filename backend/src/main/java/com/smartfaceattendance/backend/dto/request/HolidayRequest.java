package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record HolidayRequest(
    @NotNull LocalDate date,
    @NotBlank @Size(max = 100) String name,
    boolean isRecurring) {}
