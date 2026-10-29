package com.smartfaceattendance.backend.controller;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.service.*;
import jakarta.validation.Valid;
import java.time.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ManagementController {
  private final IdentityService identity;
  private final EmployeeService employees;
  private final ShiftService shifts;
  private final AttendanceService attendance;
  private final CorrectionService corrections;
  private final DepartmentService departments;

  public ManagementController(
      IdentityService i,
      EmployeeService e,
      ShiftService s,
      AttendanceService a,
      CorrectionService c,
      DepartmentService d) {
    identity = i;
    employees = e;
    shifts = s;
    attendance = a;
    corrections = c;
    departments = d;
  }

  public static <T> Map<String, Object> page(List<T> data, int page, int size) {
    if (page < 0 || size < 1 || size > 200)
      throw new ApiException(400, "Page >= 0 and size 1..200 required");
    int start = (int) Math.min((long) page * size, data.size());
    return Map.of(
        "items",
        data.subList(start, Math.min(start + size, data.size())),
        "total",
        data.size(),
        "page",
        page,
        "size",
        size);
  }

  @GetMapping("/health")
  public Object health() {
    return Map.of("status", "UP");
  }

  @GetMapping("/departments")
  public Object departments() {
    identity.manager();
    return departments.list();
  }

  @PostMapping("/departments")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object createDepartment(@Valid @RequestBody DepartmentRequest r) {
    identity.manager();
    return departments.create(r);
  }

  @PatchMapping("/departments/{id}")
  public Object updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentRequest r) {
    identity.manager();
    return departments.update(id, r);
  }

  @DeleteMapping("/departments/{id}")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void deleteDepartment(@PathVariable Long id) {
    identity.manager();
    departments.delete(id);
  }

  @GetMapping("/employees")
  public Object employees(
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "100") int size,
      @RequestParam(required = false) Long departmentId,
      @RequestParam(required = false) String unassigned) {
    identity.manager();
    var q = search.toLowerCase();
    return page(
        employees.list().stream()
            .filter(e -> e.name().toLowerCase().contains(q) || e.empId().toLowerCase().contains(q))
            .filter(
                e -> {
                  if ("true".equals(unassigned)) return e.dept() == null;
                  if (departmentId != null) return departmentId.toString().equals(e.deptId());
                  return true;
                })
            .toList(),
        page,
        size);
  }

  @PostMapping("/employees")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object create(@Valid @RequestBody EmployeeRequest r) {
    identity.manager();
    return employees.create(r);
  }

  @PatchMapping("/employees/{id}")
  public Object update(@PathVariable Long id, @Valid @RequestBody EmployeeUpdate r) {
    identity.manager();
    return employees.update(id, r);
  }

  @GetMapping("/shifts")
  public Object shifts() {
    identity.manager();
    return shifts.list();
  }

  @PostMapping("/shifts")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object shift(@Valid @RequestBody ShiftRequest r) {
    identity.manager();
    return shifts.create(r);
  }

  @GetMapping("/attendance")
  public Object attendance(
      @RequestParam LocalDate from,
      @RequestParam LocalDate to,
      @RequestParam(required = false) Long employeeId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "100") int size) {
    var user = identity.current();
    if (!"MANAGER".equals(user.role)) employeeId = identity.employee().employeeId;
    return page(attendance.report(employeeId, from, to), page, size);
  }

  @GetMapping("/policy")
  public Object policy() {
    identity.current();
    return Map.of(
        "policyConfigured",
        attendance.policyConfigured(),
        "timezone",
        "Asia/Ho_Chi_Minh",
        "message",
        attendance.policyConfigured()
            ? "Configured weekdays; no holiday/leave history in schema"
            : "Working weekdays not configured; absence totals are unavailable");
  }

  @GetMapping("/corrections")
  public Object corrections(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "100") int size) {
    return page(corrections.list(identity.current()), page, size);
  }

  @PostMapping("/corrections")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object request(@Valid @RequestBody CorrectionRequest r) {
    return corrections.create(identity.employee(), r);
  }

  @PostMapping("/corrections/{id}/review")
  public Object review(@PathVariable Long id, @Valid @RequestBody ReviewRequest r) {
    return corrections.review(identity.manager(), id, r);
  }
}
