package com.smartfaceattendance.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfaceattendance.backend.exception.ApiException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LivenessClient {
  private final String url, secret;
  private final ObjectMapper mapper;
  private final HttpClient client = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(5)).build();

  public LivenessClient(
      @Value("${app.liveness-url:}") String url,
      @Value("${app.liveness-secret:}") String secret, ObjectMapper mapper) {
    this.url = url;
    this.secret = secret;
    this.mapper = mapper;
  }

  public Map<String, Object> check(String image) {
    if (url.isBlank() || secret.isBlank())
      throw new ApiException(503, "Liveness service is not configured. No face data or attendance was saved.");
    try {
      var request = HttpRequest.newBuilder(URI.create(url.replaceAll("/$", "") + "/liveness"))
          .timeout(Duration.ofSeconds(15))
          .header("Content-Type", "application/json")
          .header("Authorization", "Bearer " + secret)
          .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(Map.of("image", image))))
          .build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      var json = mapper.readTree(response.body());
      if (response.statusCode() != 200) {
        int status = response.statusCode();
        if (status == 400 || status == 413 || status == 422)
          throw new ApiException(status, json.path("detail").asText("Invalid face image"));
        throw new ApiException(503, "Liveness service unavailable or misconfigured. Please try again.");
      }
      if (!json.path("accepted").isBoolean() || !json.path("isReal").isBoolean()
          || !json.path("modelVersion").isTextual() || json.path("modelVersion").asText().isBlank())
        throw new ApiException(503, "Invalid liveness service response");
      boolean accepted = json.path("accepted").asBoolean() && json.path("isReal").asBoolean();
      return Map.of("accepted", accepted, "isReal", accepted,
          "modelVersion", json.path("modelVersion").asText(),
          "status", accepted ? "real" : "spoof");
    } catch (ApiException e) {
      throw e;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "Liveness check interrupted");
    } catch (Exception e) {
      throw new ApiException(503, "Liveness service unavailable. No face data or attendance was saved.");
    }
  }

  public void requireLive(String image) {
    if (!Boolean.TRUE.equals(check(image).get("accepted")))
      throw new ApiException(422, "Liveness check failed. Look directly at the camera and try again.");
  }
}
