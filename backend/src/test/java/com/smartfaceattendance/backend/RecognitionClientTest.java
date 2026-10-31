package com.smartfaceattendance.backend;

import static org.junit.jupiter.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.integration.RecognitionClient;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.*;

class RecognitionClientTest {
  HttpServer server;
  RecognitionClient client;
  volatile int status = 200;
  volatile String response = "{\"accepted\":true,\"externalRef\":\"employee-3\",\"modelVersion\":\"sface-test\"}";
  volatile String requestPath, requestBody, authorization;
  final String image = "data:image/jpeg;base64,/9j/2Q==";

  @BeforeEach void start() throws Exception {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/", exchange -> {
      requestPath = exchange.getRequestURI().getPath();
      requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
      authorization = exchange.getRequestHeaders().getFirst("Authorization");
      byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(status, bytes.length);
      exchange.getResponseBody().write(bytes);
      exchange.close();
    });
    server.start();
    client = new RecognitionClient("http://127.0.0.1:" + server.getAddress().getPort(),
        "service-test", new ObjectMapper());
  }

  @AfterEach void stop() { server.stop(0); }

  @Test void enrollmentAndRecognitionUseSameStableReference() throws Exception {
    assertEquals("employee-3", client.call("/enroll", image, 3L).get("externalRef"));
    assertEquals("/enroll", requestPath);
    assertEquals(3L, new ObjectMapper().readTree(requestBody).path("employeeId").asLong());
    assertEquals("Bearer service-test", authorization);
    assertEquals("employee-3", client.call("/recognize", image, null).get("externalRef"));
    assertEquals("/recognize", requestPath);
    assertFalse(new ObjectMapper().readTree(requestBody).has("employeeId"));
  }

  @Test void unknownFacesAndDuplicateEnrollmentKeepActionableErrors() {
    for (int code : new int[] {409, 422}) {
      status = code;
      response = "{\"detail\":\"Face cannot be accepted\"}";
      var error = assertThrows(ApiException.class, () -> client.call("/enroll", image, 3L));
      assertEquals(code, error.status);
      assertEquals("Face cannot be accepted", error.getMessage());
    }
    status = 500;
    assertEquals(503, assertThrows(ApiException.class, () -> client.call("/recognize", image, null)).status);
  }
}
