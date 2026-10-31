package com.smartfaceattendance.backend.service;

import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class RecoveryDelivery {
  private static final Logger LOG = LoggerFactory.getLogger(RecoveryDelivery.class);
  @Value("${recovery.mail.host:}") private String host;
  @Value("${recovery.mail.port:587}") private int port;
  @Value("${recovery.mail.username:}") private String username;
  @Value("${recovery.mail.password:}") private String password;
  @Value("${recovery.mail.from:}") private String from;
  @Value("${recovery.mail.auth:true}") private boolean auth;
  @Value("${recovery.mail.starttls:true}") private boolean tls;

  public boolean available(String channel) {
    if ("EMAIL".equals(channel)) return !host.isBlank() && !from.isBlank()
        && (!auth || (!username.isBlank() && !password.isBlank()));
    return false;
  }

  @Async("recoveryExecutor")
  public void send(String channel, String destination, String code) {
    // Never log the OTP, recipient, provider response body, or provider credentials.
    String text = "Smart Face Attendance: Ma dat lai mat khau cua ban la " + code
        + ". Ma het han sau 10 phut. Khong chia se ma nay voi bat ky ai.";
    try {
      if ("EMAIL".equals(channel)) {
        var sender = new JavaMailSenderImpl();
        sender.setHost(host); sender.setPort(port);
        if (auth) { sender.setUsername(username); sender.setPassword(password); }
        sender.setDefaultEncoding("UTF-8");
        var properties = sender.getJavaMailProperties();
        properties.put("mail.smtp.auth", Boolean.toString(auth));
        properties.put("mail.smtp.starttls.enable", Boolean.toString(tls));
        properties.put("mail.smtp.starttls.required", Boolean.toString(tls));
        properties.put("mail.smtp.connectiontimeout", "5000");
        properties.put("mail.smtp.timeout", "5000");
        properties.put("mail.smtp.writetimeout", "5000");
        var message = new SimpleMailMessage();
        message.setFrom(from); message.setTo(destination);
        message.setSubject("Ma xac minh dat lai mat khau - Smart Face Attendance");
        message.setText(text); sender.send(message);
      }
    } catch (Exception e) { LOG.warn("Password recovery delivery failed ({})", channel); }
  }

}
