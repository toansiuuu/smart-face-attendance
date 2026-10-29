package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;

public record DepartmentRequest(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 500) String description,
    Long managerId) {}
