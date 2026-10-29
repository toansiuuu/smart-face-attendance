package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "holidays")
public class Holiday {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "holiday_date", nullable = false)
  public LocalDate holidayDate;

  @Column(name = "name", nullable = false, length = 100)
  public String name;

  @Column(name = "is_recurring", nullable = false)
  public boolean isRecurring;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
