package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.Account;
import java.time.*;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface AccountRepository extends JpaRepository<Account, Long> {
  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Account a where a.id = :id")
  Optional<Account> lockById(Long id);
  Optional<Account> findByUsername(String username);

  Optional<Account> findByEmployeeId(Long id);

  boolean existsByRole(String role);
}
