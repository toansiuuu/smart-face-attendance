package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.response.UserResponse;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class IdentityService {
  private final AccountRepository accounts;
  private final EmployeeRepository employees;

  public IdentityService(AccountRepository a, EmployeeRepository e) {
    accounts = a;
    employees = e;
  }

  public Account current() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken)
      throw new ApiException(401, "Login required");
    var a =
        accounts
            .findByUsername(auth.getName())
            .orElseThrow(() -> new ApiException(401, "Login required"));
    if (!a.enabled) throw new ApiException(401, "Account disabled");
    if (a.employeeId != null
        && !employees.findById(a.employeeId).map(e -> "ACTIVE".equals(e.status)).orElse(false))
      throw new ApiException(403, "Employee inactive");
    return a;
  }

  public Account manager() {
    var a = current();
    if (!"MANAGER".equals(a.role)) throw new ApiException(403, "Manager access required");
    return a;
  }

  public Account employee() {
    var a = current();
    if (!"EMPLOYEE".equals(a.role) || a.employeeId == null)
      throw new ApiException(403, "Employee account required");
    return a;
  }

  public UserResponse response(Account a) {
    String name =
        a.employeeId == null
            ? a.username
            : employees.findById(a.employeeId).map(e -> e.fullName).orElse(a.username);
    return new UserResponse(a.id, a.username, a.role, a.employeeId, name);
  }
}
