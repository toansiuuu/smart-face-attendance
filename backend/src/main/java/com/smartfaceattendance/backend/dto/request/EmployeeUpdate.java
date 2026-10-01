package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record EmployeeUpdate(
    @NotBlank @Size(max = 150) String fullName,
    @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE") String status) {}
