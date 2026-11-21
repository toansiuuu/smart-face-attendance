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
  private final PasswordEncoder encoder;
  private final String uploadDir;
  private final org.springframework.jdbc.core.JdbcTemplate jdbc;

  public EmployeeService(
      EmployeeRepository e,
      AccountRepository a,
      FaceEnrollmentRepository f,
      PasswordEncoder p,
      org.springframework.jdbc.core.JdbcTemplate jdbc,
      @Value("${app.upload-dir:uploads}") String uploadDir) {
    employees = e;
    accounts = a;
    faces = f;
    encoder = p;
    this.jdbc = jdbc;
    this.uploadDir = uploadDir;
  }

  public static void checkPassword(String p) {
    if (p == null || p.isBlank() || p.length() < 12 || p.getBytes(StandardCharsets.UTF_8).length > 72)
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
    if (phone != null && !phone.isBlank() && !phone.matches("0\\d{9,10}"))
      throw new ApiException(400, "Số điện thoại cần 10–11 chữ số và bắt đầu bằng 0.");
  }

  static void validateName(String name) {
    if (name == null || name.trim().length() < 2 || name.length() > 150
        || !name.trim().matches("[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]*"))
      throw new ApiException(400, "Họ tên cần 2–150 ký tự và chỉ chứa chữ, khoảng trắng, chấm hoặc gạch nối.");
  }

  static void validateDob(LocalDate dob) {
    if (dob != null) {
      if (!dob.isBefore(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))))
        throw new ApiException(400, "Date of birth must be in the past");
      if (Period.between(dob, LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))).getYears() < 16)
        throw new ApiException(400, "Employee must be at least 16 years old");
      if (Period.between(dob, LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))).getYears() > 120)
        throw new ApiException(400, "Tuổi nhân viên không được vượt quá 120.");
    }
  }

  static void validateGender(String gender) {
    if (gender != null && !gender.isBlank()
        && !gender.equals("MALE") && !gender.equals("FEMALE") && !gender.equals("OTHER"))
      throw new ApiException(400, "Gender must be MALE, FEMALE, or OTHER");
  }

  public EmployeeResponse response(Employee e) {
    return new EmployeeResponse(
        e.id,
        e.employeeCode,
        e.fullName,
        initials(e.fullName),
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

  private void lockContacts() {
    jdbc.queryForObject("SELECT id FROM employee_contact_guard WHERE id = 1 FOR UPDATE", Integer.class);
  }

  private void checkUniqueContacts(String email, String phone, Long excludedId) {
    if (email != null && !email.isBlank()
        && employees.existsByEmailIgnoreCaseAndIdNot(email.trim(), excludedId))
      throw new ApiException(409, "Email đã được sử dụng bởi tài khoản khác.");
    if (phone != null && !phone.isBlank()
        && employees.existsByPhoneAndIdNot(phone.trim(), excludedId))
      throw new ApiException(409, "Số điện thoại đã được sử dụng bởi tài khoản khác.");
  }

  @Transactional
  public EmployeeResponse create(EmployeeRequest r) {
    lockContacts();
    validateName(r.fullName());
    if (r.employeeCode() == null || !r.employeeCode().trim().matches("[A-Za-z0-9][A-Za-z0-9_-]{0,31}"))
      throw new ApiException(400, "Mã nhân viên không hợp lệ.");
    if (r.email() == null || r.email().isBlank())
      throw new ApiException(400, "Email là bắt buộc khi tạo tài khoản nhân viên.");
    checkPassword(r.password());
    validatePhone(r.phone());
    validateDob(r.dateOfBirth());
    validateGender(r.gender());
    String code = r.employeeCode().trim();
    if (employees.existsByEmployeeCodeIgnoreCase(code) || accounts.existsByUsernameIgnoreCase(code))
      throw new ApiException(409, "Tên đăng nhập / mã nhân viên đã tồn tại.");
    checkUniqueContacts(r.email(), r.phone(), -1L);
    var now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    var e = new Employee();
    e.employeeCode = code;
    e.fullName = r.fullName().trim();
    e.phone = r.phone() == null || r.phone().isBlank() ? null : r.phone().trim();
    e.email = r.email().trim().toLowerCase(Locale.ROOT);
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
    lockContacts();
    validateName(r.fullName());
    if (r.status() == null || !List.of("ACTIVE", "INACTIVE").contains(r.status())) throw new ApiException(400, "Trạng thái không hợp lệ.");
    var e = employees.lockById(id).orElseThrow(() -> new ApiException(404, "Employee not found"));
    validatePhone(r.phone());
    validateDob(r.dateOfBirth());
    validateGender(r.gender());
    String email = r.email() == null ? e.email : r.email().trim().toLowerCase(Locale.ROOT);
    String phone = r.phone() == null || r.phone().isBlank() ? null : r.phone().trim();
    // Legacy duplicates must not prevent renaming or disabling an employee.
    // Only a changed contact can introduce a new duplicate.
    checkUniqueContacts(Objects.equals(email, e.email == null ? null : e.email.trim().toLowerCase(Locale.ROOT)) ? null : email,
        Objects.equals(phone, e.phone == null || e.phone.isBlank() ? null : e.phone.trim()) ? null : phone, id);
    e.fullName = r.fullName().trim();
    e.status = r.status();
    e.phone = phone;
    if (r.email() != null) {
      if (r.email().isBlank()) throw new ApiException(400, "Email không được để trống.");
      e.email = r.email().trim().toLowerCase(Locale.ROOT);
    }
    e.position = r.position();
    e.dateOfBirth = r.dateOfBirth();
    e.gender = r.gender();
    employees.save(e);
    accounts
        .lockByEmployeeId(id)
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
    try {
      byte[] data = file.getBytes();
      String ext = ImageValidation.type(data).equals("image/png") ? ".png" : ".jpg";
      Path dir = Paths.get(uploadDir, "avatars");
      Files.createDirectories(dir);
      String name = id + "-" + UUID.randomUUID() + ext;
      Path target = dir.resolve(name);
      Files.write(target, data, StandardOpenOption.CREATE_NEW);
      String previous = e.avatarUrl;
      org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
          new org.springframework.transaction.support.TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
              try {
                if (status != STATUS_COMMITTED) Files.deleteIfExists(target);
                else if (previous != null && previous.matches("/uploads/avatars/[0-9]+(?:-[a-f0-9-]+)?\\.(png|jpg)"))
                  Files.deleteIfExists(dir.resolve(previous.substring(previous.lastIndexOf('/') + 1)));
              } catch (IOException cleanup) {
                org.slf4j.LoggerFactory.getLogger(EmployeeService.class).warn("Avatar cleanup failed");
              }
            }
          });
      e.avatarUrl = "/uploads/avatars/" + name;
      employees.saveAndFlush(e);
      return Map.of("avatarUrl", e.avatarUrl);
    } catch (IOException ex) {
      throw new ApiException(500, "Failed to save avatar file");
    }
  }
}
