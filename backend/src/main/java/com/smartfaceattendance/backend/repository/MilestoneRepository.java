package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Milestone;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
  List<Milestone> findByShiftId(Long id);
}
