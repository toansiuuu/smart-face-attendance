package com.smartfaceattendance.backend.dto.response;

import java.time.*;
import java.util.Map;

public record DayResponse(
    String id,
    Long employeeId,
    String empId,
    String name,
    String avatar,
    String dept,
    LocalDate date,
    String timeIn,
    String timeOut,
    String status,
    long workedMinutes,
    boolean complete,
    Map<String, String> milestones,
    Map<String, String> rawMilestones,
    Long shiftId) {}
