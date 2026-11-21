package com.smartfaceattendance.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.integration.*;
import com.smartfaceattendance.backend.repository.*;
import com.smartfaceattendance.backend.service.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class FaceServiceTest {
  @Test void inferenceDelayDoesNotMoveScanToTheNextWindow() {
    var employees = mock(EmployeeRepository.class);
    var faces = mock(FaceEnrollmentRepository.class);
    var recognition = mock(RecognitionClient.class);
    var liveness = mock(LivenessClient.class);
    var attendance = mock(AttendanceService.class);
    var received = LocalDateTime.of(2026, 11, 21, 10, 59, 59);
    when(attendance.now()).thenReturn(received, received.plusSeconds(8));
    var face = new FaceEnrollment(); face.employeeId = 1L;
    when(recognition.call("/recognize", "image", null)).thenReturn(Map.of("externalRef", "employee-1"));
    when(faces.findByExternalRefAndActiveTrue("employee-1")).thenReturn(Optional.of(face));
    var event = new AttendanceEvent(); event.eventType = "MORNING_IN";
    when(attendance.record(1L, received, null)).thenReturn(event);
    assertSame(event, new FaceService(employees, faces, recognition, attendance, liveness).scan("image"));
    verify(attendance, times(1)).now();
    verify(liveness).requireLive("image");
    verify(attendance).record(1L, received, null);
  }

  @Test void spoofRejectionNeverCallsIdentityOrWritesAttendance() {
    var attendance = mock(AttendanceService.class);
    var recognition = mock(RecognitionClient.class);
    var liveness = mock(LivenessClient.class);
    doThrow(new ApiException(422, "Spoof rejected")).when(liveness).requireLive("image");
    var service = new FaceService(mock(EmployeeRepository.class), mock(FaceEnrollmentRepository.class), recognition, attendance, liveness);
    assertThrows(ApiException.class, () -> service.scan("image"));
    verifyNoInteractions(recognition);
    verify(attendance, never()).record(any(), any(), any());
  }
}
