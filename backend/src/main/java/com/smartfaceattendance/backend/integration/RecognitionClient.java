package com.smartfaceattendance.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfaceattendance.backend.exception.ApiException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RecognitionClient {
  private final String url, secret;
  private final ObjectMapper mapper;
  private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  public RecognitionClient(@Value("${app.recognition-url:}") String url,
      @Value("${app.recognition-secret:}") String secret, ObjectMapper mapper) {
    this.url = url;
    this.secret = secret;
    this.mapper = mapper;
  }

  public boolean configured() { return !url.isBlank() && !secret.isBlank(); }

  private JsonNode exchange(String path, Object payload) {
    if (!configured()) throw new ApiException(503, "Employee identity matching is not configured.");
    try {
      var request = HttpRequest.newBuilder(URI.create(url.replaceAll("/$", "") + path))
          .timeout(Duration.ofSeconds(15)).header("Content-Type", "application/json")
          .header("Authorization", "Bearer " + secret)
          .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload))).build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      var json = mapper.readTree(response.body());
      if (response.statusCode() != 200) {
        int status = response.statusCode();
        if (Set.of(400, 409, 410, 413, 422, 429).contains(status))
          throw new ApiException(status, json.path("detail").asText("Face recognition rejected the image"));
        throw new ApiException(503, "Face recognition service unavailable or misconfigured");
      }
      return json;
    } catch (ApiException e) { throw e;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "Recognition interrupted");
    } catch (Exception e) { throw new ApiException(503, "Recognition service unavailable"); }
  }

  private Map<String, String> accepted(JsonNode json) {
    if (!json.path("accepted").asBoolean(false) || json.path("externalRef").asText().isBlank())
      throw new ApiException(422, "No accepted face match/enrollment");
    String ref = json.path("externalRef").asText(), version = json.path("modelVersion").asText("");
    if (ref.length() > 120 || version.length() > 80)
      throw new ApiException(502, "Recognition metadata exceeds schema limits");
    return Map.of("externalRef", ref, "modelVersion", version);
  }

  public Map<String, String> call(String path, String image, Long employeeId) {
    if (!configured()) throw new ApiException(503, "Employee identity matching is not configured.");
    if (!image.startsWith("data:image/jpeg;base64,")) throw new ApiException(400, "A JPEG data URL is required");
    try {
      byte[] bytes = Base64.getDecoder().decode(image.substring(image.indexOf(',') + 1));
      if (bytes.length > 2_000_000 || bytes.length < 3 || (bytes[0] & 255) != 255 || (bytes[1] & 255) != 216)
        throw new ApiException(400, "Invalid or oversized JPEG");
    } catch (IllegalArgumentException e) { throw new ApiException(400, "Invalid image encoding"); }
    var payload = new LinkedHashMap<String, Object>();
    payload.put("image", image);
    if (employeeId != null) payload.put("employeeId", employeeId);
    return accepted(exchange(path, payload));
  }

  public Map<String, String> enrollChallenge(Long employeeId, String challengeId) {
    return accepted(exchange("/enroll", Map.of("employeeId", employeeId, "challengeId", challengeId)));
  }

  public Object challenge(Long employeeId, String challengeId, String image) {
    var payload = new LinkedHashMap<String, Object>();
    payload.put("employeeId", employeeId);
    if (challengeId != null) payload.put("challengeId", challengeId);
    if (image != null) payload.put("image", image);
    return exchange(challengeId == null ? "/enrollment/start" : "/enrollment/frame", payload);
  }
}
