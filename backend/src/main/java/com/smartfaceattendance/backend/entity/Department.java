package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "departments")
public class Department {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(nullable = false, length = 100)
  public String name;

  @Column(length = 500)
  public String description;

  @Column(name = "manager_id")
  public Long managerId;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
