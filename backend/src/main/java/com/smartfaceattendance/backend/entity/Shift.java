package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "shifts")
public class Shift {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "shift_code", nullable = false, length = 32)
  public String shiftCode;

  @Column(name = "shift_name", nullable = false, length = 120)
  public String shiftName;

  @Column(name = "effective_from", nullable = false)
  public LocalDate effectiveFrom;
}
