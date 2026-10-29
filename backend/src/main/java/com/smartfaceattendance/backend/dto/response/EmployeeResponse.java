package com.smartfaceattendance.backend.dto.response;

public record EmployeeResponse(
    Long id,
    String empId,
    String name,
    String avatar,
    String dept,
    String deptId,
    String phone,
    boolean hasFaceData,
    String workStatus) {}
