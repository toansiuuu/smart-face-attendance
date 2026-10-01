package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "user_accounts")
public class Account {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "employee_id")
  public Long employeeId;

  @Column(name = "username", nullable = false, length = 80)
  public String username;

  @Column(name = "password_hash", nullable = false, length = 255)
  public String passwordHash;

  @Column(name = "role", nullable = false, columnDefinition = "enum('MANAGER','EMPLOYEE')")
  public String role;

  @Column(name = "enabled", nullable = false)
  public boolean enabled;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
