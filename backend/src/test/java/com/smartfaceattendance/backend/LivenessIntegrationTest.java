package com.smartfaceattendance.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfaceattendance.backend.entity.Employee;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.integration.*;
import com.smartfaceattendance.backend.repository.*;
import com.smartfaceattendance.backend.service.*;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.junit.jupiter.api.*;

class LivenessIntegrationTest {
  HttpServer server;
  LivenessClient client;
  int status = 200;
  String body = "{\"accepted\":true,\"isReal\":true,\"modelVersion\":\"test\"}";

  @BeforeEach void start() throws Exception {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/liveness", exchange -> {
      if (!"Bearer test-secret".equals(exchange.getRequestHeaders().getFirst("Authorization"))) {
        exchange.sendResponseHeaders(401, -1);
      } else {
        var bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
      }
      exchange.close();
    });
    server.start();
    client = new LivenessClient("http://127.0.0.1:" + server.getAddress().getPort(),
        "test-secret", new ObjectMapper());
  }

  @AfterEach void stop() { server.stop(0); }

  @Test void liveFacePassesAuthenticatedHttpCall() {
    assertDoesNotThrow(() -> client.requireLive("image"));
  }

  @Test void spoofAndMalformedResponsesAreRejected() {
    body = "{\"accepted\":false,\"isReal\":false,\"modelVersion\":\"test\"}";
    assertEquals(422, assertThrows(ApiException.class, () -> client.requireLive("image")).status);
    body = "{\"accepted\":true}";
    assertEquals(503, assertThrows(ApiException.class, () -> client.requireLive("image")).status);
  }

  @Test void imageErrorsAndOutagesArePropagated() {
    status = 422;
    body = "{\"detail\":\"Show exactly one face\"}";
    assertEquals(422, assertThrows(ApiException.class, () -> client.requireLive("image")).status);
    status = 500;
    assertEquals(503, assertThrows(ApiException.class, () -> client.requireLive("image")).status);
  }

  @Test void rejectedLivenessNeverCallsIdentityOrWritesFaceData() {
    body = "{\"accepted\":false,\"isReal\":false,\"modelVersion\":\"test\"}";
    var employees = mock(EmployeeRepository.class);
    var faces = mock(FaceEnrollmentRepository.class);
    var recognition = mock(RecognitionClient.class);
    var attendance = mock(AttendanceService.class);
    var service = new FaceService(employees, faces, recognition, attendance, client);
    var employee = new Employee();
    employee.status = "ACTIVE";
    when(employees.lockById(1L)).thenReturn(Optional.of(employee));
    assertThrows(ApiException.class, () -> service.scan("image"));
    assertThrows(ApiException.class, () -> service.enroll(1L, "image"));
    verifyNoInteractions(recognition, faces, attendance);
  }

  @Test void liveFaceStillRequiresIdentityService() {
    var service = new FaceService(mock(EmployeeRepository.class), mock(FaceEnrollmentRepository.class),
        new RecognitionClient("", "", new ObjectMapper()), mock(AttendanceService.class), client);
    var error = assertThrows(ApiException.class, () -> service.scan("image"));
    assertEquals(503, error.status);
    assertTrue(error.getMessage().contains("identity matching"));
  }
}
