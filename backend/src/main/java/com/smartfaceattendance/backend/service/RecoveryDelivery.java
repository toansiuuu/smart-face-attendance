package com.smartfaceattendance.backend.service;

import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
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
  @Value("${recovery.twilio.sid:}") private String sid;
  @Value("${recovery.twilio.token:}") private String token;
  @Value("${recovery.twilio.from:}") private String smsFrom;

  public boolean available(String channel) {
    if ("EMAIL".equals(channel)) return !host.isBlank() && !from.isBlank()
        && (!auth || (!username.isBlank() && !password.isBlank()));
    return "SMS".equals(channel) && sid.matches("AC[0-9a-fA-F]{32}")
        && !token.isBlank() && smsFrom.matches("\\+[1-9][0-9]{7,14}");
  }

  @Async("recoveryExecutor")
  public void send(String channel, String destination, String code) {
    // Never log the OTP, recipient, provider response body, or provider credentials.
    String text = "Smart Face Attendance: Ma dat lai mat khau cua ban la " + code
        + ". Ma het han sau 10 phut. Khong chia se ma nay voi bat ky ai.";
    try {
      if ("EMAIL".equals(channel)) {
        var sender = new JavaMailSenderImpl();
        sender.setHost(host); sender.setPort(port); sender.setUsername(username); sender.setPassword(password);
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
      } else {
        var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        String authorization = Base64.getEncoder().encodeToString((sid + ":" + token).getBytes(StandardCharsets.UTF_8));
        String body = "To=" + encode(destination) + "&From=" + encode(smsFrom) + "&Body=" + encode(text);
        var request = HttpRequest.newBuilder(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json"))
            .timeout(Duration.ofSeconds(10)).header("Authorization", "Basic " + authorization)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body)).build();
        var response = client.send(request, HttpResponse.BodyHandlers.discarding());
        if (response.statusCode() != 201) throw new IllegalStateException("SMS delivery rejected");
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt(); LOG.warn("Password recovery delivery interrupted ({})", channel);
    } catch (Exception e) { LOG.warn("Password recovery delivery failed ({})", channel); }
  }

  private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
}
