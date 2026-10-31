package com.smartfaceattendance.backend.controller;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.service.PasswordRecoveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/password-recovery")
public class PasswordRecoveryController {
  private final PasswordRecoveryService service;
  public PasswordRecoveryController(PasswordRecoveryService service) { this.service = service; }
  @GetMapping("/options") public Object options() { return service.options(); }
  @PostMapping("/request") public Object request(@Valid @RequestBody RecoveryRequest body, HttpServletRequest request) {
    return service.request(body, request.getRemoteAddr());
  }
  @PostMapping("/reset") public Object reset(@Valid @RequestBody ResetPasswordRequest body, HttpServletRequest request) {
    service.reset(body);
    if (request.getSession(false) != null) request.getSession(false).invalidate();
    org.springframework.security.core.context.SecurityContextHolder.clearContext();
    return Map.of("message", "Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.");
  }
}
