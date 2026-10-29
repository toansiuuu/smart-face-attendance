package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "employee_id", nullable = false)
  public Long employeeId;

  @Column(name = "leave_type", nullable = false, columnDefinition = "enum('ANNUAL','SICK','PERSONAL','OTHER')")
  public String leaveType;

  @Column(name = "start_date", nullable = false)
  public LocalDate startDate;

  @Column(name = "end_date", nullable = false)
  public LocalDate endDate;

  @Column(name = "reason", nullable = false, columnDefinition = "text")
  public String reason;

  @Column(name = "status", nullable = false, columnDefinition = "enum('PENDING','APPROVED','REJECTED','CANCELLED')")
  public String status;

  @Column(name = "approved_by")
  public Long approvedBy;

  @Column(name = "review_note", length = 500)
  public String reviewNote;

  @Column(name = "created_at", nullable = false)
  public LocalDateTime createdAt;
}
