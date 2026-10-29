package com.smartfaceattendance.backend.dto.response;

public record DepartmentResponse(
    Long id,
    String name,
    String description,
    Long managerId,
    String managerName,
    long employeeCount) {}
