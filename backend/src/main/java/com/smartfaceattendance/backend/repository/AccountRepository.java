package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Account;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface AccountRepository extends JpaRepository<Account, Long> {
  Optional<Account> findByUsername(String username);

  Optional<Account> findByEmployeeId(Long id);

  boolean existsByRole(String role);
}
