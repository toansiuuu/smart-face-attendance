package com.smartfaceattendance.backend.dto.response;

public record UserResponse(Long id, String username, String role, Long employeeId, String name) {}
