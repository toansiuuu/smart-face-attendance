package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.DepartmentRequest;
import com.smartfaceattendance.backend.dto.response.DepartmentResponse;
import com.smartfaceattendance.backend.entity.Department;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.DepartmentRepository;
import com.smartfaceattendance.backend.repository.EmployeeRepository;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DepartmentService {
  private final DepartmentRepository departments;
  private final EmployeeRepository employees;

  public DepartmentService(DepartmentRepository d, EmployeeRepository e) {
    departments = d;
    employees = e;
  }

  public DepartmentResponse response(Department d) {
    String managerName = null;
    if (d.managerId != null) {
      managerName = employees.findById(d.managerId).map(e -> e.fullName).orElse(null);
    }
    return new DepartmentResponse(
        d.id,
        d.name,
        d.description,
        d.managerId,
        managerName,
        employees.countByDepartmentId(d.id));
  }

  public List<DepartmentResponse> list() {
    return departments.findAll().stream()
        .sorted(Comparator.comparing(d -> d.id))
        .map(this::response)
        .toList();
  }

  @Transactional
  public DepartmentResponse create(DepartmentRequest r) {
    String name = r.name().trim();
    if (departments.existsByName(name))
      throw new ApiException(409, "Department name already exists");
    if (r.managerId() != null && employees.findById(r.managerId()).isEmpty())
      throw new ApiException(404, "Manager employee not found");
    var d = new Department();
    d.name = name;
    d.description = r.description();
    d.managerId = r.managerId();
    d.createdAt = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    departments.saveAndFlush(d);
    return response(d);
  }

  @Transactional
  public DepartmentResponse update(Long id, DepartmentRequest r) {
    var d = departments.findById(id).orElseThrow(() -> new ApiException(404, "Department not found"));
    String name = r.name().trim();
    if (!d.name.equals(name) && departments.existsByName(name))
      throw new ApiException(409, "Department name already exists");
    if (r.managerId() != null && employees.findById(r.managerId()).isEmpty())
      throw new ApiException(404, "Manager employee not found");
    d.name = name;
    d.description = r.description();
    d.managerId = r.managerId();
    departments.save(d);
    return response(d);
  }

  @Transactional
  public void delete(Long id) {
    var d = departments.findById(id).orElseThrow(() -> new ApiException(404, "Department not found"));
    if (employees.countByDepartmentId(id) > 0)
      throw new ApiException(409, "Cannot delete department with assigned employees");
    departments.delete(d);
  }
}
