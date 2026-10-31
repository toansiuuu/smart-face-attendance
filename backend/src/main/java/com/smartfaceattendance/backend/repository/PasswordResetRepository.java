package com.smartfaceattendance.backend.repository;

import com.smartfaceattendance.backend.entity.PasswordReset;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from PasswordReset r where r.id = :id")
  Optional<PasswordReset> lockById(String id);
  long countBySubjectHashAndCreatedAtAfter(String hash, LocalDateTime after);
  long countByRequesterHashAndCreatedAtAfter(String hash, LocalDateTime after);
  void deleteByCreatedAtBefore(LocalDateTime cutoff);
}
