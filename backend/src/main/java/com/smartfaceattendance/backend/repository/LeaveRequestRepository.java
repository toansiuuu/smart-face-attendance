package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.LeaveRequest;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
  List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

  List<LeaveRequest> findByStatusOrderByCreatedAtDesc(String status);

  @Query("SELECT r FROM LeaveRequest r WHERE r.employeeId = ?1 AND r.status IN ('PENDING','APPROVED') AND r.startDate <= ?3 AND r.endDate >= ?2")
  List<LeaveRequest> findOverlapping(Long employeeId, LocalDate start, LocalDate end);

  @Query("SELECT r FROM LeaveRequest r WHERE r.employeeId = ?1 AND r.status = 'APPROVED' AND r.startDate <= ?2 AND r.endDate >= ?2")
  List<LeaveRequest> findApprovedForDate(Long employeeId, LocalDate date);
}
