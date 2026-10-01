package com.smartfaceattendance.backend.config;

import com.smartfaceattendance.backend.entity.Account;
import com.smartfaceattendance.backend.repository.AccountRepository;
import com.smartfaceattendance.backend.service.EmployeeService;
import java.time.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class DevelopmentSetup {
  @Bean
  CommandLineRunner firstManager(
      AccountRepository accounts,
      PasswordEncoder encoder,
      @Value("${DEV_ADMIN_PASSWORD:}") String password,
      @Value("${DEV_ADMIN_USERNAME:admin}") String username) {
    return args -> {
      if (password.isBlank()) {
        System.out.println("Manager setup skipped: DEV_ADMIN_PASSWORD is not set.");
        return;
      }
      if (accounts.existsByRole("MANAGER")) {
        System.out.println("Manager setup skipped: a manager already exists.");
        return;
      }
      if (accounts.findByUsername(username).isPresent())
        throw new IllegalStateException(
            "Setup username already exists; choose a different DEV_ADMIN_USERNAME. No account was"
                + " changed.");
      EmployeeService.checkPassword(password);
      if (username.isBlank() || username.length() > 80)
        throw new IllegalStateException("Invalid setup username");
      var a = new Account();
      a.username = username;
      a.passwordHash = encoder.encode(password);
      a.role = "MANAGER";
      a.enabled = true;
      a.createdAt = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
      accounts.save(a);
      System.out.println("First MANAGER created successfully.");
    };
  }
}
