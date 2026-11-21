package com.smartfaceattendance.backend.dto.response;

import java.time.*;
import java.util.List;

public record AttendanceReport(
    LocalDate from, LocalDate to, LocalDateTime generatedAt, String timezone,
    Long employeeId, int employeeCount, Totals totals, List<Daily> byDate,
    List<Staff> byEmployee, List<DayResponse> details) {

  public record Totals(long employeeDays, long workingDays, long presentDays,
      long presentWorkingDays, long absentDays, long lateDays, long earlyDays,
      long incompleteDays, long completeDays, long offDays, long unconfiguredDays,
      long pendingDays, long invalidDays, long correctedDays, long workedMinutes,
      Double attendanceRate) {}

  public record Daily(LocalDate date, Totals totals) {}

  public record Staff(Long employeeId, String empId, String name, String status, Totals totals) {}
}
