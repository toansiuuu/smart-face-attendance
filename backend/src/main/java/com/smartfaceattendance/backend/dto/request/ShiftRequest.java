package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.List;

public record ShiftRequest(
    @NotBlank @Size(max = 32) @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9_-]*", message = "Mã lịch chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.") String shiftCode,
    @NotBlank @Size(max = 120) String shiftName,
    @NotNull LocalDate effectiveFrom,
    @NotNull @Size(min = 4, max = 4) List<@NotNull @Valid MilestoneRequest> milestones,
    @NotEmpty(message = "Chọn ít nhất một ngày làm việc.") @Size(max = 7) List<@NotNull DayOfWeek> workingDays) {}
