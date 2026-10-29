package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Department;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
  boolean existsByName(String name);

  Optional<Department> findByName(String name);
}
