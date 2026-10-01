package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "correction_requests")
public class Correction {
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

  @Column(name = "proposed_occurred_at", nullable = false)
  public LocalDateTime proposedOccurredAt;

  @Column(name = "reason", nullable = false, columnDefinition = "text")
  public String reason;

  @Column(
      name = "status",
      nullable = false,
      columnDefinition = "enum('PENDING','APPROVED','REJECTED')")
  public String status;

  @Column(name = "requested_by_account_id", nullable = false)
  public Long requestedByAccountId;

  @Column(name = "reviewed_by_account_id")
  public Long reviewedByAccountId;

  @Column(name = "reviewed_at")
  public LocalDateTime reviewedAt;

  @Column(name = "review_note", length = 500)
  public String reviewNote;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
