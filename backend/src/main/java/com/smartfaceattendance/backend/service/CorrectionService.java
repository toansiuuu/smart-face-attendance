package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CorrectionService {
  private final CorrectionRepository requests;
  private final EmployeeRepository employees;
  private final AttendanceService attendance;

  public CorrectionService(CorrectionRepository c, EmployeeRepository e, AttendanceService a) {
    requests = c;
    employees = e;
    attendance = a;
  }

  public Object view(Correction c) {
    var e = employees.findById(c.employeeId).orElseThrow();
    var map = new LinkedHashMap<String, Object>();
    map.put("id", c.id);
    map.put("name", e.fullName);
    map.put("empId", e.employeeCode);
    map.put("dateTarget", c.workDate);
    map.put("submitTime", c.createdAt);
    map.put("eventType", c.eventType);
    map.put("requestedTime", c.proposedOccurredAt.toLocalTime());
    map.put(
        "recordedTime",
        Optional.ofNullable(attendance.raw(c.employeeId, c.workDate).get(c.eventType))
            .map(t -> t.toLocalTime().toString())
            .orElse("—"));
    map.put("reason", c.reason);
    map.put("status", c.status);
    map.put("attachments", 0);
    map.put("reviewNote", c.reviewNote);
    map.put("reviewedAt", c.reviewedAt);
    return map;
  }

  public List<Object> list(Account user) {
    return ("MANAGER".equals(user.role)
            ? requests.findAllByOrderByCreatedAtDesc()
            : requests.findByEmployeeIdOrderByCreatedAtDesc(user.employeeId))
        .stream().map(this::view).toList();
  }

  @Transactional
  public Object create(Account user, CorrectionRequest r) {
    var e =
        employees
            .lockById(user.employeeId)
            .orElseThrow(() -> new ApiException(404, "Employee not found"));
    if (!ShiftService.TYPES.contains(r.eventType()))
      throw new ApiException(400, "Unknown event type");
    var now = attendance.now();
    if (r.workDate().isBefore(e.createdAt.toLocalDate())
        || LocalDateTime.of(r.workDate(), r.requestedTime()).isAfter(now))
      throw new ApiException(
          400, "Correction must be after employee creation and not in the future");
    if (requests.existsByEmployeeIdAndWorkDateAndEventTypeAndStatus(
        e.id, r.workDate(), r.eventType(), "PENDING"))
      throw new ApiException(409, "A pending request already exists for this milestone");
    var c = new Correction();
    c.employeeId = e.id;
    c.shiftId = attendance.historicalShift(e.id, r.workDate());
    c.workDate = r.workDate();
    c.eventType = r.eventType();
    c.proposedOccurredAt = LocalDateTime.of(r.workDate(), r.requestedTime());
    c.reason = r.reason().trim();
    c.status = "PENDING";
    c.requestedByAccountId = user.id;
    c.createdAt = now;
    requests.saveAndFlush(c);
    return view(c);
  }

  @Transactional
  public Object review(Account reviewer, Long id, ReviewRequest r) {
    // Read only the parent id before locking: avoid caching a stale PENDING entity.
    var employeeId =
        requests
            .findEmployeeIdById(id)
            .orElseThrow(() -> new ApiException(404, "Request not found"));
    employees.lockById(employeeId).orElseThrow();
    var c = requests.lockById(id).orElseThrow();
    if (!"PENDING".equals(c.status)) throw new ApiException(409, "Request already reviewed");
    if (c.requestedByAccountId.equals(reviewer.id))
      throw new ApiException(403, "Self-approval is not allowed");
    if (r.approve()) {
      var times = attendance.effective(c.employeeId, c.workDate);
      times.put(c.eventType, c.proposedOccurredAt);
      if (!AttendanceMath.ordered(times))
        throw new ApiException(409, "Proposed correction reverses milestone order");
    }
    c.status = r.approve() ? "APPROVED" : "REJECTED";
    c.reviewedByAccountId = reviewer.id;
    c.reviewedAt = attendance.now();
    c.reviewNote = r.note();
    requests.saveAndFlush(c);
    return view(c);
  }
}
