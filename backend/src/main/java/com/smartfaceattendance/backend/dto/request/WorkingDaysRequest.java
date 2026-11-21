package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.DayOfWeek;
import java.util.List;

public record WorkingDaysRequest(
    @NotEmpty(message = "Chọn ít nhất một ngày làm việc.") @Size(max = 7)
    List<@NotNull DayOfWeek> workingDays) {}
