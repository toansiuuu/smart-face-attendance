package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "attendance_events")
public class AttendanceEvent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "employee_id", nullable = false)
  public Long employeeId;

  @Column(name = "shift_id", nullable = false)
  public Long shiftId;

  @Column(name = "work_date", nullable = false)
  public LocalDate workDate;

  @Column(
      name = "event_type",
      nullable = false,
      columnDefinition = "enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT')")
  public String eventType;

  @Column(name = "occurred_at", nullable = false)
  public LocalDateTime occurredAt;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
