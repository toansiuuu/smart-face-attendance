package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "face_enrollments")
public class FaceEnrollment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "employee_id", nullable = false)
  public Long employeeId;

  @Column(name = "external_ref", nullable = false, length = 120)
  public String externalRef;

  @Column(name = "model_version", length = 80)
  public String modelVersion;

  @Column(name = "active", nullable = false)
  public boolean active;

  @Column(name = "enrolled_at", nullable = false)
  public LocalDateTime enrolledAt;
}
