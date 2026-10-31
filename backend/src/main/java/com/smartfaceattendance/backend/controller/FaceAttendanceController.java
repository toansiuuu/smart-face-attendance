package com.smartfaceattendance.backend.controller;

import com.smartfaceattendance.backend.dto.request.EnrollmentRequest;
import com.smartfaceattendance.backend.dto.request.FaceRequest;
import com.smartfaceattendance.backend.repository.EmployeeRepository;
import com.smartfaceattendance.backend.service.FaceService;
import com.smartfaceattendance.backend.service.IdentityService;
import com.smartfaceattendance.backend.integration.LivenessClient;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FaceAttendanceController {
  private final IdentityService identity;
  private final EmployeeRepository employees;
  private final FaceService faces;
  private final LivenessClient liveness;

  public FaceAttendanceController(
      IdentityService identity, EmployeeRepository employees, FaceService faces, LivenessClient liveness) {
    this.identity = identity;
    this.employees = employees;
    this.faces = faces;
    this.liveness = liveness;
  }

  @PostMapping("/face/liveness")
  public Object liveness(@Valid @RequestBody EnrollmentRequest request) {
    identity.manager();
    return liveness.check(request.image());
  }

  // No account login is needed to submit a camera scan. Identity comes from recognition.
  @PostMapping("/diem-danh")
  public Object scan(@Valid @RequestBody FaceRequest request) {
    var event = faces.scan(request.anhKhuonMat());
    return Map.of(
        "tenNhanVien",
        employees.findById(event.employeeId).orElseThrow().fullName,
        "thoiGian",
        event.occurredAt.toLocalTime().toString(),
        "caLam",
        event.eventType,
        "trangThai",
        "Chấm công thành công");
  }

  @PostMapping("/employees/{id}/face-enrollment")
  public Object enroll(@PathVariable Long id, @Valid @RequestBody EnrollmentRequest request) {
    identity.manager();
    return faces.enroll(id, request.image());
  }
}
