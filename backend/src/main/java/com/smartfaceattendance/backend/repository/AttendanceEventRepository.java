package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.AttendanceEvent;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface AttendanceEventRepository extends JpaRepository<AttendanceEvent, Long> {
  List<AttendanceEvent> findByEmployeeIdAndWorkDateBetween(Long id, LocalDate start, LocalDate end);

  Optional<AttendanceEvent> findByEmployeeIdAndWorkDateAndEventType(
      Long id, LocalDate date, String type);
}
