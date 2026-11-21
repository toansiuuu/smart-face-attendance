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
  Optional<Account> findByUsernameIgnoreCase(String username);

  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Account a where a.username = :username")
  Optional<Account> lockByUsername(@org.springframework.data.repository.query.Param("username") String username);

  Optional<Account> findByEmployeeId(Long id);

  @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from Account a where a.employeeId = :id")
  Optional<Account> lockByEmployeeId(@org.springframework.data.repository.query.Param("id") Long id);

  boolean existsByUsernameIgnoreCase(String username);

  boolean existsByRole(String role);
}
