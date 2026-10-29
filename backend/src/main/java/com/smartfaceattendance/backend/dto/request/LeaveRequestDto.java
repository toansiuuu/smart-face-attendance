package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record LeaveRequestDto(
    @NotBlank @Pattern(regexp = "ANNUAL|SICK|PERSONAL|OTHER") String leaveType,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotBlank @Size(max = 500) String reason) {}
