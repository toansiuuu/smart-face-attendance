package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record EmployeeRequest(
    @NotBlank @Size(max = 32) String employeeCode,
    @NotBlank @Size(max = 150) String fullName,
    @NotBlank @Size(min = 12, max = 72) String password,
    Long departmentId,
    @Size(max = 20) String phone,
    @Size(max = 255) @Email String email,
    @Size(max = 100) String position,
    LocalDate dateOfBirth,
    String gender) {}
