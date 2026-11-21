package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.response.*;
import com.smartfaceattendance.backend.entity.Employee;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.EmployeeRepository;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceReportService {
  private final AttendanceService attendance;
  private final EmployeeRepository employees;

  public AttendanceReportService(AttendanceService attendance, EmployeeRepository employees) {
    this.attendance = attendance;
    this.employees = employees;
  }

  @Transactional(readOnly = true)
  public AttendanceReport summary(Long employeeId, LocalDate from, LocalDate to) {
    var now = attendance.now();
    if (from == null || to == null || from.isAfter(to) || to.isAfter(now.toLocalDate())
        || ChronoUnit.DAYS.between(from, to) > 366)
      throw new ApiException(400, "Chọn khoảng ngày hợp lệ, tối đa 367 ngày và không vượt quá hôm nay.");
    List<Employee> staff = employeeId == null ? employees.findAll() : List.of(employees.findById(employeeId)
        .orElseThrow(() -> new ApiException(404, "Không tìm thấy nhân viên.")));
    var details = attendance.report(employeeId, from, to);
    var byDate = details.stream().collect(Collectors.groupingBy(DayResponse::date));
    var byEmployee = details.stream().collect(Collectors.groupingBy(DayResponse::employeeId));
    var daily = new ArrayList<AttendanceReport.Daily>();
    for (var date = from; !date.isAfter(to); date = date.plusDays(1))
      daily.add(new AttendanceReport.Daily(date, totals(byDate.getOrDefault(date, List.of()))));
    var employees = staff.stream().sorted(Comparator.comparing(e -> e.employeeCode))
        .map(e -> new AttendanceReport.Staff(e.id, e.employeeCode, e.fullName, e.status,
            totals(byEmployee.getOrDefault(e.id, List.of())))).toList();
    return new AttendanceReport(from, to, now, "Asia/Ho_Chi_Minh", employeeId, staff.size(),
        totals(details), daily, employees, details);
  }

  static AttendanceReport.Totals totals(List<DayResponse> days) {
    long working = 0, present = 0, presentWorking = 0, absent = 0, late = 0, early = 0,
        incomplete = 0, complete = 0, off = 0, unknown = 0, pending = 0, invalid = 0,
        corrected = 0, minutes = 0;
    for (var d : days) {
      if (d.workingDay()) working++;
      if (d.present()) present++;
      if (d.workingDay() && d.present()) presentWorking++;
      if ("Vắng mặt".equals(d.status())) absent++;
      // Count independent flags: a day can be late AND early AND missing a scan.
      if (d.workingDay() && d.late()) late++;
      if (d.workingDay() && d.early()) early++;
      if (d.missingMilestones()) incomplete++;
      if (d.complete()) complete++;
      if (d.workingDaysConfigured() && !d.workingDay()) off++;
      if (!d.workingDaysConfigured()) unknown++;
      if (d.workingDay() && !d.present() && !"Vắng mặt".equals(d.status())) pending++;
      if (d.invalidOrder()) invalid++;
      if (d.corrected()) corrected++;
      minutes += d.workedMinutes();
    }
    long classified = presentWorking + absent;
    Double rate = classified == 0 ? null : Math.round(1000.0 * presentWorking / classified) / 10.0;
    return new AttendanceReport.Totals(days.size(), working, present, presentWorking, absent,
        late, early, incomplete, complete, off, unknown, pending, invalid, corrected, minutes, rate);
  }
}
