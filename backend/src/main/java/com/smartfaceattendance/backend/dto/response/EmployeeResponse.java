package com.smartfaceattendance.backend.dto.response;

import java.time.LocalDate;

public record EmployeeResponse(
    Long id,
    String empId,
    String name,
    String avatar,
    String dept,
    String deptId,
    String phone,
    String email,
    String position,
    LocalDate dateOfBirth,
    String gender,
    String avatarUrl,
    boolean hasFaceData,
    String workStatus) {}
