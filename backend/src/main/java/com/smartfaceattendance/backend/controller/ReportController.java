package com.smartfaceattendance.backend.controller;

import com.smartfaceattendance.backend.dto.response.AttendanceReport;
import com.smartfaceattendance.backend.service.*;
import java.time.LocalDate;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final IdentityService identity;
  private final AttendanceReportService reports;

  public ReportController(IdentityService identity, AttendanceReportService reports) {
    this.identity = identity;
    this.reports = reports;
  }

  @GetMapping("/attendance")
  public ResponseEntity<AttendanceReport> attendance(@RequestParam LocalDate from,
      @RequestParam LocalDate to, @RequestParam(required = false) Long employeeId) {
    identity.manager();
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(reports.summary(employeeId, from, to));
  }
}
