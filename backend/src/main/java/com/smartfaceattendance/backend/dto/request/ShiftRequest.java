package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.List;

public record ShiftRequest(
    @NotBlank @Size(max = 32) String shiftCode,
    @NotBlank @Size(max = 120) String shiftName,
    @NotNull LocalDate effectiveFrom,
    @NotNull @Size(min = 4, max = 4) List<@NotNull @Valid MilestoneRequest> milestones) {}
