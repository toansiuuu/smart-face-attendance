package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Correction;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface CorrectionRepository extends JpaRepository<Correction, Long> {
  List<Correction> findByEmployeeIdAndWorkDateBetween(Long id, LocalDate start, LocalDate end);

  List<Correction> findByEmployeeIdOrderByCreatedAtDesc(Long id);

  List<Correction> findAllByOrderByCreatedAtDesc();

  boolean existsByEmployeeIdAndWorkDateAndEventTypeAndStatus(
      Long id, LocalDate date, String type, String status);

  @Query("select c.employeeId from Correction c where c.id=:id")
  Optional<Long> findEmployeeIdById(@Param("id") Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from Correction c where c.id=:id")
  Optional<Correction> lockById(@Param("id") Long id);
}
