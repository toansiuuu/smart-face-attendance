package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.dto.response.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EmployeeService {
  private final EmployeeRepository employees;
  private final AccountRepository accounts;
  private final FaceEnrollmentRepository faces;
  private final DepartmentRepository departments;
  private final PasswordEncoder encoder;
  private final String uploadDir;

  public EmployeeService(
      EmployeeRepository e,
      AccountRepository a,
      FaceEnrollmentRepository f,
      DepartmentRepository d,
      PasswordEncoder p,
      @Value("${app.upload-dir:uploads}") String uploadDir) {
    employees = e;
    accounts = a;
    faces = f;
    departments = d;
    encoder = p;
    this.uploadDir = uploadDir;
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

  static void validatePhone(String phone) {
    if (phone != null && !phone.isBlank() && !phone.matches("\\d{10,11}"))
      throw new ApiException(400, "Phone must be 10-11 digits");
  }

  static void validateDob(LocalDate dob) {
    if (dob != null) {
      if (!dob.isBefore(LocalDate.now()))
        throw new ApiException(400, "Date of birth must be in the past");
      if (Period.between(dob, LocalDate.now()).getYears() < 16)
        throw new ApiException(400, "Employee must be at least 16 years old");
    }
  }

  static void validateGender(String gender) {
    if (gender != null && !gender.isBlank()
        && !gender.equals("MALE") && !gender.equals("FEMALE") && !gender.equals("OTHER"))
      throw new ApiException(400, "Gender must be MALE, FEMALE, or OTHER");
  }

  public EmployeeResponse response(Employee e) {
    String deptName = null;
    String deptId = null;
    if (e.departmentId != null) {
      var dept = departments.findById(e.departmentId);
      deptName = dept.map(d -> d.name).orElse(null);
      deptId = e.departmentId.toString();
    }
    return new EmployeeResponse(
        e.id,
        e.employeeCode,
        e.fullName,
        initials(e.fullName),
        deptName,
        deptId,
        e.phone,
        e.email,
        e.position,
        e.dateOfBirth,
        e.gender,
        e.avatarUrl,
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
    validatePhone(r.phone());
    validateDob(r.dateOfBirth());
    validateGender(r.gender());
    String code = r.employeeCode().trim();
    if (employees.existsByEmployeeCode(code) || accounts.findByUsername(code).isPresent())
      throw new ApiException(409, "Employee code or username already exists");
    var now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    if (r.departmentId() != null) {
      departments
          .findById(r.departmentId())
          .orElseThrow(() -> new ApiException(404, "Department not found"));
    }
    var e = new Employee();
    e.employeeCode = code;
    e.fullName = r.fullName().trim();
    e.departmentId = r.departmentId();
    e.phone = r.phone();
    e.email = r.email();
    e.position = r.position();
    e.dateOfBirth = r.dateOfBirth();
    e.gender = r.gender();
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
    validatePhone(r.phone());
    validateDob(r.dateOfBirth());
    validateGender(r.gender());
    e.fullName = r.fullName().trim();
    e.status = r.status();
    if (r.departmentId() != null) {
      departments
          .findById(r.departmentId())
          .orElseThrow(() -> new ApiException(404, "Department not found"));
    }
    e.departmentId = r.departmentId();
    e.phone = r.phone();
    e.email = r.email();
    e.position = r.position();
    e.dateOfBirth = r.dateOfBirth();
    e.gender = r.gender();
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

  @Transactional
  public Object uploadAvatar(Long id, MultipartFile file) {
    var e = employees.lockById(id).orElseThrow(() -> new ApiException(404, "Employee not found"));
    if (file.isEmpty()) throw new ApiException(400, "File is empty");
    if (file.getSize() > 2_000_000) throw new ApiException(400, "File exceeds 2MB limit");
    String ct = file.getContentType();
    if (ct == null || (!ct.equals("image/jpeg") && !ct.equals("image/png")))
      throw new ApiException(400, "Only JPEG and PNG are accepted");
    String ext = ct.equals("image/png") ? ".png" : ".jpg";
    try {
      Path dir = Paths.get(uploadDir, "avatars");
      Files.createDirectories(dir);
      Path target = dir.resolve(id + ext);
      file.transferTo(target);
      e.avatarUrl = "/uploads/avatars/" + id + ext;
      employees.save(e);
      return Map.of("avatarUrl", e.avatarUrl);
    } catch (IOException ex) {
      throw new ApiException(500, "Failed to save avatar file");
    }
  }
}
