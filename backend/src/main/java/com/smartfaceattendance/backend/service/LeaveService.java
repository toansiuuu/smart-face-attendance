package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.LeaveRequestDto;
import com.smartfaceattendance.backend.dto.request.ReviewRequest;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaveService {
  private final LeaveRequestRepository leaves;
  private final EmployeeRepository employees;

  public LeaveService(LeaveRequestRepository l, EmployeeRepository e) {
    leaves = l;
    employees = e;
  }

  public boolean isOnLeave(Long employeeId, LocalDate date) {
    return !leaves.findApprovedForDate(employeeId, date).isEmpty();
  }

  public List<Map<String, Object>> listForEmployee(Long employeeId) {
    return leaves.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
        .map(this::toMap).toList();
  }

  public List<Map<String, Object>> listPending() {
    return leaves.findByStatusOrderByCreatedAtDesc("PENDING").stream()
        .map(r -> {
          var m = new LinkedHashMap<>(toMap(r));
          employees.findById(r.employeeId).ifPresent(e -> m.put("employeeName", e.fullName));
          return (Map<String, Object>) m;
        }).toList();
  }

  @Transactional
  public Map<String, Object> create(Account account, LeaveRequestDto dto) {
    if (account.employeeId == null) throw new ApiException(403, "Only employees can submit leave");
    if (dto.endDate().isBefore(dto.startDate()))
      throw new ApiException(400, "End date must be on or after start date");
    var today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    if (!"SICK".equals(dto.leaveType()) && dto.startDate().isBefore(today))
      throw new ApiException(400, "Start date cannot be in the past (except sick leave)");
    if ("SICK".equals(dto.leaveType()) && dto.startDate().isBefore(today.minusDays(3)))
      throw new ApiException(400, "Sick leave can only be submitted retroactively for up to 3 days");
    var overlaps = leaves.findOverlapping(account.employeeId, dto.startDate(), dto.endDate());
    if (!overlaps.isEmpty())
      throw new ApiException(409, "Overlapping leave request exists for this date range");

    var r = new LeaveRequest();
    r.employeeId = account.employeeId;
    r.leaveType = dto.leaveType();
    r.startDate = dto.startDate();
    r.endDate = dto.endDate();
    r.reason = dto.reason().trim();
    r.status = "PENDING";
    r.createdAt = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    leaves.saveAndFlush(r);
    return toMap(r);
  }

  @Transactional
  public Map<String, Object> review(Account manager, Long id, ReviewRequest req) {
    var r = leaves.findById(id).orElseThrow(() -> new ApiException(404, "Leave request not found"));
    if (!"PENDING".equals(r.status))
      throw new ApiException(409, "This request has already been reviewed");
    if (manager.employeeId != null && manager.employeeId.equals(r.employeeId))
      throw new ApiException(403, "Cannot approve your own leave request");
    r.status = req.approve() ? "APPROVED" : "REJECTED";
    r.approvedBy = manager.id;
    r.reviewNote = req.note();
    leaves.saveAndFlush(r);
    return toMap(r);
  }

  @Transactional
  public void cancel(Account account, Long id) {
    var r = leaves.findById(id).orElseThrow(() -> new ApiException(404, "Leave request not found"));
    if (!r.employeeId.equals(account.employeeId))
      throw new ApiException(403, "Can only cancel your own leave request");
    if (!"PENDING".equals(r.status))
      throw new ApiException(409, "Only pending requests can be cancelled");
    r.status = "CANCELLED";
    leaves.save(r);
  }

  public Map<String, Object> balance(Long employeeId, int year) {
    var all = leaves.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
        .filter(r -> "APPROVED".equals(r.status))
        .filter(r -> r.startDate.getYear() == year || r.endDate.getYear() == year)
        .toList();
    long annual = 0, sick = 0, personal = 0, other = 0;
    for (var r : all) {
      long days = ChronoUnit.DAYS.between(r.startDate, r.endDate) + 1;
      switch (r.leaveType) {
        case "ANNUAL" -> annual += days;
        case "SICK" -> sick += days;
        case "PERSONAL" -> personal += days;
        default -> other += days;
      }
    }
    return Map.of("year", year, "annualAllowance", 12, "annualUsed", annual,
        "annualRemaining", Math.max(0, 12 - annual), "sickUsed", sick,
        "personalUsed", personal, "otherUsed", other);
  }

  private Map<String, Object> toMap(LeaveRequest r) {
    var m = new LinkedHashMap<String, Object>();
    m.put("id", r.id); m.put("employeeId", r.employeeId);
    m.put("leaveType", r.leaveType); m.put("startDate", r.startDate.toString());
    m.put("endDate", r.endDate.toString()); m.put("reason", r.reason);
    m.put("status", r.status); m.put("reviewNote", r.reviewNote);
    m.put("createdAt", r.createdAt.toString());
    return m;
  }
}
