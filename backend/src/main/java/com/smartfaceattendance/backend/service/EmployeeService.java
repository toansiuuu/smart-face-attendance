package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.dto.response.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {
  private final EmployeeRepository employees;
  private final AccountRepository accounts;
  private final FaceEnrollmentRepository faces;
  private final PasswordEncoder encoder;

  public EmployeeService(
      EmployeeRepository e, AccountRepository a, FaceEnrollmentRepository f, PasswordEncoder p) {
    employees = e;
    accounts = a;
    faces = f;
    encoder = p;
  }

  public static void checkPassword(String p) {
    if (p.length() < 12 || p.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new ApiException(
          400, "Password must be at least 12 characters and at most 72 UTF-8 bytes.");
  }

  public static String initials(String name) {
    return Arrays.stream(name.trim().split("\s+"))
        .filter(x -> !x.isEmpty())
        .reduce("", (s, x) -> s + x.substring(0, 1))
        .toUpperCase();
  }

  public EmployeeResponse response(Employee e) {
    return new EmployeeResponse(
        e.id,
        e.employeeCode,
        e.fullName,
        initials(e.fullName),
        null,
        null,
        faces.findByEmployeeId(e.id).map(f -> f.active).orElse(false),
        "ACTIVE".equals(e.status) ? "Đang làm việc" : "Đã nghỉ việc");
  }

  public List<EmployeeResponse> list() {
    return employees.findAll().stream()
        .sorted(Comparator.comparing(e -> e.id))
        .map(this::response)
        .toList();
  }

  @Transactional
  public EmployeeResponse create(EmployeeRequest r) {
    checkPassword(r.password());
    String code = r.employeeCode().trim();
    if (employees.existsByEmployeeCode(code) || accounts.findByUsername(code).isPresent())
      throw new ApiException(409, "Employee code or username already exists");
    var now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    var e = new Employee();
    e.employeeCode = code;
    e.fullName = r.fullName().trim();
    e.status = "ACTIVE";
    e.createdAt = now;
    employees.saveAndFlush(e);
    var a = new Account();
    a.employeeId = e.id;
    a.username = code;
    a.passwordHash = encoder.encode(r.password());
    a.role = "EMPLOYEE";
    a.enabled = true;
    a.createdAt = now;
    accounts.saveAndFlush(a);
    return response(e);
  }

  @Transactional
  public EmployeeResponse update(Long id, EmployeeUpdate r) {
    var e = employees.lockById(id).orElseThrow(() -> new ApiException(404, "Employee not found"));
    e.fullName = r.fullName().trim();
    e.status = r.status();
    employees.save(e);
    accounts
        .findByEmployeeId(id)
        .ifPresent(
            a -> {
              a.enabled = "ACTIVE".equals(r.status());
              accounts.save(a);
            });
    return response(e);
  }
}
