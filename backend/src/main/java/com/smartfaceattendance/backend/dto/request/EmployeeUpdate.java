package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record EmployeeUpdate(
    @NotBlank @Size(max = 150) String fullName,
    @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE") String status,
    Long departmentId,
    @Size(max = 20) String phone,
    @Size(max = 255) @Email String email,
    @Size(max = 100) String position,
    LocalDate dateOfBirth,
    String gender) {}
