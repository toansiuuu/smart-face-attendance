package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;

@Service
public class PasswordRecoveryService {
  private final PasswordResetRepository resets;
  private final AccountRepository accounts;
  private final EmployeeRepository employees;
  private final PasswordEncoder encoder;
  private final RecoveryDelivery delivery;
  private final Clock clock;
  private final TransactionTemplate transactions;
  private final SecureRandom random = new SecureRandom();
  @Value("${recovery.phone-country-code:84}") private String countryCode;
  @Value("${recovery.admin.username:admin}") private String adminUsername;
  @Value("${recovery.admin.email:}") private String adminEmail;
  @Value("${recovery.admin.phone:}") private String adminPhone;
  private static final String INVALID = "Mã xác minh không hợp lệ, đã hết hạn hoặc đã được sử dụng.";

  public PasswordRecoveryService(PasswordResetRepository resets, AccountRepository accounts,
      EmployeeRepository employees, PasswordEncoder encoder, RecoveryDelivery delivery, Clock clock,
      PlatformTransactionManager manager) {
    this.resets = resets; this.accounts = accounts; this.employees = employees;
    this.encoder = encoder; this.delivery = delivery; this.clock = clock;
    transactions = new TransactionTemplate(manager);
  }

  public Map<String, Boolean> options() {
    return Map.of("emailEnabled", delivery.available("EMAIL"), "smsEnabled", delivery.available("SMS"));
  }

  private LocalDateTime now() { return LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC); }

  private String canonical(String contact, String channel) {
    if (contact == null) return "";
    if ("EMAIL".equals(channel)) return contact.trim().toLowerCase(Locale.ROOT);
    String phone = contact.replaceAll("[\\s().-]", "");
    if (phone.startsWith("0")) phone = "+" + countryCode + phone.substring(1);
    return phone.matches("\\+[1-9][0-9]{7,14}") ? phone : "";
  }

  private boolean active(Account account) {
    return account.enabled && (account.employeeId == null || employees.findById(account.employeeId)
        .map(employee -> "ACTIVE".equals(employee.status)).orElse(false));
  }

  private String destination(Account account, String channel) {
    if (account.employeeId != null) {
      return employees.findById(account.employeeId)
          .map(employee -> canonical("EMAIL".equals(channel) ? employee.email : employee.phone, channel)).orElse("");
    }
    if ("MANAGER".equals(account.role) && account.username.equals(adminUsername))
      return canonical("EMAIL".equals(channel) ? adminEmail : adminPhone, channel);
    return "";
  }

  // The application runs one backend instance. Commit inside the lock so parallel
  // requests cannot race the persisted per-account/per-IP request counters.
  public synchronized Map<String, Object> request(RecoveryRequest body, String requester) {
    if (!delivery.available(body.channel()))
      throw new ApiException(503, "Kênh gửi mã chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
    return transactions.execute(transaction -> {
      var now = now();
      String subject = AccountPrincipal.fingerprint(body.username().trim().toLowerCase(Locale.ROOT));
      String source = AccountPrincipal.fingerprint(requester);
      resets.deleteByCreatedAtBefore(now.minusDays(1));
      if (resets.countBySubjectHashAndCreatedAtAfter(subject, now.minusSeconds(60)) > 0
          || resets.countBySubjectHashAndCreatedAtAfter(subject, now.minusMinutes(15)) >= 3
          || resets.countByRequesterHashAndCreatedAtAfter(source, now.minusHours(1)) >= 10)
        throw new ApiException(429, "Bạn đã yêu cầu quá nhiều lần. Vui lòng chờ rồi thử lại.");

      var account = accounts.findByUsername(body.username().trim()).orElse(null);
      String supplied = canonical(body.contact(), body.channel());
      String contact = account == null ? "" : destination(account, body.channel());
      boolean matched = account != null && active(account) && !contact.isBlank() && contact.equals(supplied);
      String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
      var reset = new PasswordReset();
      reset.id = UUID.randomUUID().toString();
      reset.accountId = matched ? account.id : null;
      reset.subjectHash = subject; reset.requesterHash = source; reset.channel = body.channel();
      reset.destinationHash = AccountPrincipal.fingerprint(contact);
      reset.passwordFingerprint = AccountPrincipal.fingerprint(matched ? account.passwordHash : "");
      reset.codeHash = encoder.encode(code); reset.createdAt = now; reset.expiresAt = now.plusMinutes(10);
      resets.saveAndFlush(reset);
      if (matched) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override public void afterCommit() {
          try { delivery.send(body.channel(), contact, code); }
          catch (org.springframework.core.task.TaskRejectedException e) {
            org.slf4j.LoggerFactory.getLogger(PasswordRecoveryService.class).warn("Recovery delivery queue is full");
          }
        }
      });
      // Always return the same shape/message for known, unknown, and mismatched contacts.
      return Map.of("requestId", reset.id, "expiresInSeconds", 600, "retryAfterSeconds", 60,
          "message", "Nếu tài khoản và thông tin liên hệ khớp, bạn sẽ nhận mã xác minh trong ít phút.");
    });
  }

  @Transactional(noRollbackFor = ApiException.class)
  public void reset(ResetPasswordRequest body) {
    EmployeeService.checkPassword(body.newPassword());
    var reset = resets.lockById(body.requestId()).orElseThrow(() -> new ApiException(400, INVALID));
    if (reset.consumed || reset.attempts >= 5 || !now().isBefore(reset.expiresAt))
      throw new ApiException(400, INVALID);
    reset.attempts++;
    if (!encoder.matches(body.code(), reset.codeHash) || reset.accountId == null)
      throw new ApiException(400, INVALID);
    var account = accounts.lockById(reset.accountId).orElseThrow(() -> new ApiException(400, INVALID));
    if (!active(account)
        || !reset.passwordFingerprint.equals(AccountPrincipal.fingerprint(account.passwordHash))
        || !reset.destinationHash.equals(AccountPrincipal.fingerprint(destination(account, reset.channel))))
      throw new ApiException(400, INVALID);
    account.passwordHash = encoder.encode(body.newPassword());
    accounts.save(account);
    reset.consumed = true;
  }
}
