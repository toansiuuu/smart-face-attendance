package com.smartfaceattendance.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_requests")
public class PasswordReset {
  @Id @Column(length = 36) public String id;
  @Column(name = "account_id") public Long accountId;
  @Column(name = "subject_hash", nullable = false, length = 64) public String subjectHash;
  @Column(name = "requester_hash", nullable = false, length = 64) public String requesterHash;
  @Column(nullable = false, length = 5) public String channel;
  @Column(name = "destination_hash", nullable = false, length = 64) public String destinationHash;
  @Column(name = "password_fingerprint", nullable = false, length = 64) public String passwordFingerprint;
  @Column(name = "code_hash", nullable = false, length = 100) public String codeHash;
  @Column(nullable = false) public int attempts;
  @Column(nullable = false) public boolean consumed;
  @Column(name = "created_at", nullable = false) public LocalDateTime createdAt;
  @Column(name = "expires_at", nullable = false) public LocalDateTime expiresAt;
}
