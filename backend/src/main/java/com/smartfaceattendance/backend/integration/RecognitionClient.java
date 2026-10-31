package com.smartfaceattendance.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfaceattendance.backend.exception.ApiException;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RecognitionClient {
  private final String url, secret;
  private final ObjectMapper mapper;
  private final HttpClient client =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  public RecognitionClient(
      @Value("${app.recognition-url:}") String u,
      @Value("${app.recognition-secret:}") String s,
      ObjectMapper m) {
    url = u;
    secret = s;
    mapper = m;
  }

  public boolean configured() {
    return !url.isBlank() && !secret.isBlank();
  }

  public Map<String, String> call(String path, String image, Long employeeId) {
    if (!configured())
      throw new ApiException(
          503, "Employee identity matching is not configured. Liveness alone cannot enroll or record attendance.");
    if (!image.startsWith("data:image/jpeg;base64,"))
      throw new ApiException(400, "A JPEG data URL is required");
    try {
      byte[] bytes = Base64.getDecoder().decode(image.substring(image.indexOf(',') + 1));
      if (bytes.length > 2_000_000
          || bytes.length < 3
          || (bytes[0] & 255) != 255
          || (bytes[1] & 255) != 216) throw new ApiException(400, "Invalid or oversized JPEG");
    } catch (IllegalArgumentException e) {
      throw new ApiException(400, "Invalid image encoding");
    }
    try {
      var payload = new LinkedHashMap<String, Object>();
      payload.put("image", image);
      if (employeeId != null) payload.put("employeeId", employeeId);
      var request =
          HttpRequest.newBuilder(URI.create(url.replaceAll("/$", "") + path))
              .timeout(Duration.ofSeconds(15))
              .header("Content-Type", "application/json")
              .header("Authorization", "Bearer " + secret)
              .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)))
              .build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      var json = mapper.readTree(response.body());
      if (response.statusCode() != 200) {
        int status = response.statusCode();
        if (status == 400 || status == 409 || status == 413 || status == 422)
          throw new ApiException(status, json.path("detail").asText("Face recognition rejected the image"));
        throw new ApiException(503, "Face recognition service unavailable or misconfigured");
      }
      if (!json.path("accepted").asBoolean(false) || json.path("externalRef").asText().isBlank())
        throw new ApiException(422, "No accepted face match/enrollment");
      String ref = json.path("externalRef").asText(),
          version = json.path("modelVersion").asText("");
      if (ref.length() > 120 || version.length() > 80)
        throw new ApiException(502, "Recognition metadata exceeds schema limits");
      return Map.of("externalRef", ref, "modelVersion", version);
    } catch (ApiException e) {
      throw e;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "Recognition interrupted");
    } catch (Exception e) {
      throw new ApiException(
          503, "Recognition service unavailable; no simulated success was substituted");
    }
  }
}
