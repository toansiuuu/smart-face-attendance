package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Shift;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface ShiftRepository extends JpaRepository<Shift, Long> {
  Optional<Shift> findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(LocalDate date);

  boolean existsByEffectiveFrom(LocalDate date);
}
