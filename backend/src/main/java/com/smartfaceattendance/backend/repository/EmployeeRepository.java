package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Employee;
import jakarta.persistence.LockModeType;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select e from Employee e where e.id=:id")
  Optional<Employee> lockById(@Param("id") Long id);

  boolean existsByEmployeeCode(String code);

  boolean existsByEmployeeCodeIgnoreCase(String code);
  boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
  boolean existsByPhoneAndIdNot(String phone, Long id);

  long countByDepartmentId(Long departmentId);

  List<Employee> findByDepartmentId(Long departmentId);
}
