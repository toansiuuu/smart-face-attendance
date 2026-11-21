package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record EmployeeUpdate(
    @NotBlank @Size(min = 2, max = 150) @Pattern(regexp = "[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]*", message = "Họ tên chỉ gồm chữ, khoảng trắng và dấu chấm/gạch nối.") String fullName,
    @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE") String status,
    @Pattern(regexp = "|0[0-9]{9,10}", message = "Số điện thoại cần 10–11 chữ số, bắt đầu bằng 0.") String phone,
    @Size(max = 255) @Email @Pattern(regexp = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+", message = "Email không hợp lệ.") String email,
    @Size(max = 100) @Pattern(regexp = "|.*\\S.*", message = "Chức vụ không được chỉ có khoảng trắng.") String position,
    @Past(message = "Ngày sinh phải trước hôm nay.") LocalDate dateOfBirth,
    @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giới tính không hợp lệ.") String gender) {}
