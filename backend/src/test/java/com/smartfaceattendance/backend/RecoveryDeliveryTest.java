package com.smartfaceattendance.backend;

import static org.junit.jupiter.api.Assertions.*;
import com.smartfaceattendance.backend.service.RecoveryDelivery;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class RecoveryDeliveryTest {
  @Test void emailAdapterSendsOtpThroughSmtp() throws Exception {
    try (var server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
      server.setSoTimeout(8000);
      var transcript = new CompletableFuture<String>();
      var worker = new Thread(() -> {
        try (var socket = server.accept()) {
          socket.setSoTimeout(8000);
          var reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
          var writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true);
          writer.print("220 localhost test SMTP\r\n"); writer.flush();
          var received = new StringBuilder();
          boolean data = false;
          String line;
          while ((line = reader.readLine()) != null) {
            received.append(line).append('\n');
            if (data) {
              if (line.equals(".")) { data = false; writer.print("250 queued\r\n"); }
            } else if (line.startsWith("EHLO") || line.startsWith("HELO")) {
              writer.print("250 localhost\r\n");
            } else if (line.equals("DATA")) { data = true; writer.print("354 send message\r\n");
            } else if (line.equals("QUIT")) { writer.print("221 goodbye\r\n"); writer.flush(); break;
            } else { writer.print("250 OK\r\n"); }
            writer.flush();
          }
          transcript.complete(received.toString());
        } catch (Exception e) { transcript.completeExceptionally(e); }
      });
      worker.setDaemon(true); worker.start();
      var delivery = new RecoveryDelivery();
      ReflectionTestUtils.setField(delivery, "host", "127.0.0.1");
      ReflectionTestUtils.setField(delivery, "port", server.getLocalPort());
      ReflectionTestUtils.setField(delivery, "from", "attendance@example.test");
      ReflectionTestUtils.setField(delivery, "username", "");
      ReflectionTestUtils.setField(delivery, "password", "");
      ReflectionTestUtils.setField(delivery, "auth", false);
      ReflectionTestUtils.setField(delivery, "tls", false);
      assertTrue(delivery.available("EMAIL"));
      delivery.send("EMAIL", "recipient@example.test", "123456");
      String sent = transcript.get(10, TimeUnit.SECONDS);
      assertTrue(sent.contains("recipient@example.test"));
      assertTrue(sent.contains("123456"));
    }
  }

  @Test void smsConfigurationRequiresCredentialsAndInternationalSender() {
    var delivery = new RecoveryDelivery();
    ReflectionTestUtils.setField(delivery, "sid", "AC" + "a".repeat(32));
    ReflectionTestUtils.setField(delivery, "token", "test-token");
    ReflectionTestUtils.setField(delivery, "smsFrom", "+12025550123");
    assertTrue(delivery.available("SMS"));
    ReflectionTestUtils.setField(delivery, "token", "");
    assertFalse(delivery.available("SMS"));
  }
}
