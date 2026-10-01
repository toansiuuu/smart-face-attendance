package com.smartfaceattendance.backend.controller;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.exception.*;
import com.smartfaceattendance.backend.repository.*;
import com.smartfaceattendance.backend.service.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AccountRepository accounts;
  private final PasswordEncoder encoder;
  private final IdentityService identity;
  private final SecurityContextRepository contexts;

  public AuthController(
      AccountRepository a, PasswordEncoder p, IdentityService i, SecurityContextRepository c) {
    accounts = a;
    encoder = p;
    identity = i;
    contexts = c;
  }

  @GetMapping("/csrf")
  public Object csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @PostMapping("/login")
  public Object login(
      @Valid @RequestBody LoginRequest body, HttpServletRequest req, HttpServletResponse res) {
    var a =
        accounts
            .findByUsername(body.username())
            .orElseThrow(() -> new ApiException(401, "Invalid username or password"));
    if (!a.enabled || !encoder.matches(body.password(), a.passwordHash))
      throw new ApiException(401, "Invalid username or password");
    var authentication =
        UsernamePasswordAuthenticationToken.authenticated(
            a.username, null, List.of(new SimpleGrantedAuthority("ROLE_" + a.role)));
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);
    try {
      identity.current();
    } catch (RuntimeException e) {
      SecurityContextHolder.clearContext();
      throw e;
    }
    if (req.getSession(false) != null) req.getSession(false).invalidate();
    req.getSession(true);
    contexts.saveContext(context, req, res);
    return identity.response(a);
  }

  @GetMapping("/me")
  public Object me() {
    return identity.response(identity.current());
  }

  @PostMapping("/logout")
  public Object logout(HttpServletRequest req) {
    if (req.getSession(false) != null) req.getSession(false).invalidate();
    SecurityContextHolder.clearContext();
    return Map.of("message", "Logged out");
  }

  @PostMapping("/password")
  public Object password(@Valid @RequestBody PasswordRequest body, HttpServletRequest req) {
    var a = identity.current();
    if (!encoder.matches(body.currentPassword(), a.passwordHash))
      throw new ApiException(400, "Current password incorrect");
    EmployeeService.checkPassword(body.newPassword());
    a.passwordHash = encoder.encode(body.newPassword());
    accounts.save(a);
    if (req.getSession(false) != null) req.getSession(false).invalidate();
    SecurityContextHolder.clearContext();
    return Map.of("message", "Password changed. Log in again.");
  }
}
