package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record EmployeeRequest(
    @NotBlank @Size(max = 32) @Pattern(regexp = "[A-Za-z0-9][A-Za-z0-9_-]*", message = "Mã nhân viên chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.") String employeeCode,
    @NotBlank @Size(min = 2, max = 150) @Pattern(regexp = "[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]*", message = "Họ tên chỉ gồm chữ, khoảng trắng và dấu chấm/gạch nối.") String fullName,
    @NotBlank @Size(min = 12, max = 72) String password,
    @Pattern(regexp = "|0[0-9]{9,10}", message = "Số điện thoại cần 10–11 chữ số, bắt đầu bằng 0.") String phone,
    @NotBlank @Size(max = 255) @Email @Pattern(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = "Email không hợp lệ.") String email,
    @Size(max = 100) @Pattern(regexp = "|.*\\S.*", message = "Chức vụ không được chỉ có khoảng trắng.") String position,
    @Past(message = "Ngày sinh phải trước hôm nay.") LocalDate dateOfBirth,
    @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giới tính không hợp lệ.") String gender) {}
