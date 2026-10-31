package com.smartfaceattendance.backend.config;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.*;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder encoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityContextRepository contexts() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return http.securityContext(x -> x.securityContextRepository(contexts))
        .authorizeHttpRequests(
            x ->
                x.requestMatchers(HttpMethod.POST, "/api/diem-danh")
                    .permitAll()
                    .requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/auth/password-recovery/options", "/api/health", "/error")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/password-recovery/request", "/api/auth/password-recovery/reset")
                    .permitAll()
                    .requestMatchers("/uploads/**")
                    .permitAll()
                    .requestMatchers("/api/**")
                    .authenticated()
                    .anyRequest()
                    .denyAll())
        .requestCache(x -> x.disable())
        .formLogin(x -> x.disable())
        .httpBasic(x -> x.disable())
        .logout(x -> x.disable())
        .exceptionHandling(
            x ->
                x.authenticationEntryPoint(
                        (req, res, e) -> {
                          res.setStatus(401);
                          res.setContentType("application/json");
                          res.getWriter().write("{\"message\":\"Authentication required\"}");
                        })
                    .accessDeniedHandler(
                        (req, res, e) -> {
                          res.setStatus(403);
                          res.setContentType("application/json");
                          res.getWriter()
                              .write(
                                  "{\"message\":\"Access denied or CSRF token missing/expired\"}");
                        }))
        .build();
  }
}
