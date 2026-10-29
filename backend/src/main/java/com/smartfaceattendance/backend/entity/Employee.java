package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "employees")
public class Employee {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "employee_code", nullable = false, length = 32)
  public String employeeCode;

  @Column(name = "full_name", nullable = false, length = 150)
  public String fullName;

  @Column(name = "department_id")
  public Long departmentId;

  @Column(name = "phone", length = 20)
  public String phone;

  @Column(name = "email", length = 255)
  public String email;

  @Column(name = "position", length = 100)
  public String position;

  @Column(name = "date_of_birth")
  public LocalDate dateOfBirth;

  @Column(name = "gender", columnDefinition = "enum('MALE','FEMALE','OTHER')")
  public String gender;

  @Column(name = "avatar_url", length = 500)
  public String avatarUrl;

  @Column(name = "status", nullable = false, columnDefinition = "enum('ACTIVE','INACTIVE')")
  public String status;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
