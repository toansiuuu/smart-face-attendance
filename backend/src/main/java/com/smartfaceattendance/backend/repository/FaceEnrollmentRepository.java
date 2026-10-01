package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.FaceEnrollment;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface FaceEnrollmentRepository extends JpaRepository<FaceEnrollment, Long> {
  Optional<FaceEnrollment> findByEmployeeId(Long id);

  Optional<FaceEnrollment> findByExternalRefAndActiveTrue(String ref);
}
