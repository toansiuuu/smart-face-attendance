package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Holiday;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {
  boolean existsByHolidayDate(LocalDate date);

  List<Holiday> findByHolidayDateBetween(LocalDate from, LocalDate to);

  @Query("SELECT h FROM Holiday h WHERE h.isRecurring = true")
  List<Holiday> findRecurring();
}
