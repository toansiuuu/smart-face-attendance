package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.integration.RecognitionClient;
import com.smartfaceattendance.backend.integration.LivenessClient;
import com.smartfaceattendance.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FaceService {
  private final EmployeeRepository employees;
  private final FaceEnrollmentRepository faces;
  private final RecognitionClient recognition;
  private final LivenessClient liveness;
  private final AttendanceService attendance;

  public FaceService(
      EmployeeRepository e, FaceEnrollmentRepository f, RecognitionClient r, AttendanceService a,
      LivenessClient l) {
    employees = e;
    faces = f;
    recognition = r;
    liveness = l;
    attendance = a;
  }

  @Transactional
  public Object enroll(Long id, String image) {
    var e = employees.lockById(id).orElseThrow(() -> new ApiException(404, "Employee not found"));
    if (!"ACTIVE".equals(e.status)) throw new ApiException(409, "Employee inactive");
    liveness.requireLive(image);
    var result = recognition.call("/enroll", image, id);
    var f = faces.findByEmployeeId(id).orElseGet(FaceEnrollment::new);
    f.employeeId = id;
    f.externalRef = result.get("externalRef");
    f.modelVersion = result.get("modelVersion");
    f.active = true;
    f.enrolledAt = attendance.now();
    faces.saveAndFlush(f);
    return java.util.Map.of("employeeId", id, "hasFaceData", true);
  }

  public AttendanceEvent scan(String image) {
    liveness.requireLive(image);
    var result = recognition.call("/recognize", image, null);
    var face =
        faces
            .findByExternalRefAndActiveTrue(result.get("externalRef"))
            .orElseThrow(() -> new ApiException(422, "Face is not actively enrolled"));
    return attendance.record(face.employeeId, attendance.now(), null);
  }
}
