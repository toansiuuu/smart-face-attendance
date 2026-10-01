package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "shift_milestones")
public class Milestone {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "shift_id", nullable = false)
  public Long shiftId;

  @Column(
      name = "event_type",
      nullable = false,
      columnDefinition = "enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT')")
  public String eventType;

  @Column(name = "target_time", nullable = false)
  public LocalTime targetTime;

  @Column(name = "window_start", nullable = false)
  public LocalTime windowStart;

  @Column(name = "window_end", nullable = false)
  public LocalTime windowEnd;
}
