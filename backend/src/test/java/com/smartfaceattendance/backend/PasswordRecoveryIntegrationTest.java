package com.smartfaceattendance.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import com.smartfaceattendance.backend.service.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:recovery;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.jpa.hibernate.ddl-auto=none",
    "spring.sql.init.mode=always", "spring.sql.init.schema-locations=classpath:schema-test.sql"})
@AutoConfigureMockMvc
class PasswordRecoveryIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired PasswordResetRepository resets;
  @Autowired AccountRepository accounts;
  @Autowired EmployeeRepository employees;
  @Autowired EmployeeService employeeService;
  @Autowired PasswordRecoveryService recovery;
  @Autowired PasswordEncoder encoder;
  @MockitoBean RecoveryDelivery delivery;
  @MockitoBean Clock clock;
  AtomicReference<Instant> time = new AtomicReference<>();
  Long employeeId;
  static final String BASE = "/api/auth/password-recovery";
  static final String ORIGINAL = "OriginalPassword123";
  static final String NEW = "NewSecurePassword456";

  @BeforeEach void setup() {
    resets.deleteAll(); accounts.deleteAll(); employees.deleteAll();
    time.set(Instant.parse("2026-10-31T10:00:00Z"));
    when(clock.instant()).thenAnswer(invocation -> time.get());
    when(delivery.available(anyString())).thenReturn(true);
    employeeId = employeeService.create(new EmployeeRequest("RECOVERY", "Recovery User", ORIGINAL, "0912345678", "worker@example.test", null, null, null)).id();
  }

  JsonNode request(String username, String channel) throws Exception {
    var response = mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(new RecoveryRequest(username, channel))))
        .andExpect(status().isOk()).andReturn();
    return mapper.readTree(response.getResponse().getContentAsString());
  }

  String code(String channel, String destination) {
    var capture = ArgumentCaptor.forClass(String.class);
    verify(delivery, timeout(2000)).send(eq(channel), eq(destination), capture.capture());
    return capture.getValue();
  }

  void reset(String id, String code, int expected) throws Exception {
    mvc.perform(post(BASE + "/reset").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(new ResetPasswordRequest(id, code, NEW))))
        .andExpect(status().is(expected));
  }

  MockHttpSession login(String password) throws Exception {
    return (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(Map.of("username", "RECOVERY", "password", password))))
        .andExpect(status().isOk()).andReturn().getRequest().getSession(false);
  }

  @Test void publicEndpointsRequireCsrfAndValidInput() throws Exception {
    mvc.perform(get(BASE + "/options")).andExpect(status().isOk()).andExpect(jsonPath("$.emailEnabled").value(true));
    mvc.perform(post(BASE + "/request").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(post(BASE + "/reset").with(csrf()).contentType("application/json").content("{}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post(BASE + "/verify").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
  }

  @Test void codeVerificationPrecedesNewPasswordAndOnlyWrongCodesCountAsAttempts() throws Exception {
    var result = request("RECOVERY", "EMAIL");
    String id = result.path("requestId").asText(), code = code("EMAIL", "worker@example.test");
    String wrong = code.equals("000000") ? "111111" : "000000";
    for (int i = 0; i < 4; i++) {
      mvc.perform(post(BASE + "/verify").with(csrf()).contentType("application/json")
          .content(mapper.writeValueAsString(new VerifyRecoveryCodeRequest(id, wrong))))
          .andExpect(status().isBadRequest());
    }
    mvc.perform(post(BASE + "/verify").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(new VerifyRecoveryCodeRequest(id, code))))
        .andExpect(status().isOk());
    assertEquals(4, resets.findById(id).orElseThrow().attempts);
    assertTrue(encoder.matches(ORIGINAL, accounts.findByUsername("RECOVERY").orElseThrow().passwordHash));
    reset(id, code, 200);
    mvc.perform(post(BASE + "/verify").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(new VerifyRecoveryCodeRequest(id, code))))
        .andExpect(status().isBadRequest());
  }

  @Test void recipientCannotBeRedirectedByPublicRequest() throws Exception {
    mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json")
        .content("{\"username\":\"RECOVERY\",\"channel\":\"EMAIL\",\"contact\":\"attacker@example.test\"}"))
        .andExpect(status().isOk());
    code("EMAIL", "worker@example.test");
    verify(delivery, never()).send(eq("EMAIL"), eq("attacker@example.test"), anyString());
  }

  @Test void eachEmployeeReceivesCodesOnlyAtTheirOwnStoredEmail() throws Exception {
    employeeService.create(new EmployeeRequest("SECOND", "Second User", ORIGINAL, "0987654321", "second@example.test", null, null, null));
    request("RECOVERY", "EMAIL");
    code("EMAIL", "worker@example.test");
    request("SECOND", "EMAIL");
    code("EMAIL", "second@example.test");

  }

  @Test void employeeCreationRequiresValidEmail() throws Exception {
    var admin = new Account();
    admin.username = "admin"; admin.passwordHash = encoder.encode(ORIGINAL);
    admin.role = "MANAGER"; admin.enabled = true; admin.createdAt = LocalDateTime.now();
    accounts.save(admin);
    var managerSession = (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(Map.of("username", "admin", "password", ORIGINAL))))
        .andExpect(status().isOk()).andReturn().getRequest().getSession(false);
    for (String email : List.of("", "invalid-email")) {
      var body = new EmployeeRequest("NEWUSER", "New User", ORIGINAL, null, email, null, null, null);
      mvc.perform(post("/api/employees").session(managerSession).with(csrf()).contentType("application/json")
          .content(mapper.writeValueAsString(body))).andExpect(status().isBadRequest());
    }
    assertFalse(accounts.findByUsername("NEWUSER").isPresent());
  }

  @Test void duplicateUsernameEmailAndPhoneAreRejectedWithoutCreatingAccounts() {
    for (var body : List.of(
        new EmployeeRequest("recovery", "Other", ORIGINAL, null, "other@example.test", null, null, null),
        new EmployeeRequest("OTHER", "Other", ORIGINAL, null, " WORKER@EXAMPLE.TEST ", null, null, null),
        new EmployeeRequest("OTHER", "Other", ORIGINAL, "0912345678", "other@example.test", null, null, null))) {
      var error = assertThrows(ApiException.class, () -> employeeService.create(body));
      assertEquals(409, error.status);
    }
    assertFalse(accounts.findByUsername("OTHER").isPresent());
  }

  @Test void updateCannotTakeAnotherEmployeesEmailOrPhoneButCanKeepOwnContacts() {
    Long second = employeeService.create(new EmployeeRequest("SECOND", "Second", ORIGINAL, "0987654321", "second@example.test", null, null, null)).id();
    for (var body : List.of(
        new EmployeeUpdate("Second", "ACTIVE", "0987654321", "WORKER@EXAMPLE.TEST", null, null, null),
        new EmployeeUpdate("Second", "ACTIVE", "0912345678", "second@example.test", null, null, null))) {
      assertEquals(409, assertThrows(ApiException.class, () -> employeeService.update(second, body)).status);
    }
    employeeService.update(employeeId, new EmployeeUpdate("Recovery User", "ACTIVE",
        "0912345678", "worker@example.test", null, null, null));
    assertEquals("second@example.test", employees.findById(second).orElseThrow().email);
  }

  @Test void concurrentCreatesCannotShareEmail() throws Exception {
    var pool = Executors.newFixedThreadPool(2);
    var start = new CountDownLatch(1);
    try {
      var jobs = new ArrayList<Future<Boolean>>();
      for (String username : List.of("FIRST", "SECOND")) {
        jobs.add(pool.submit(() -> {
          start.await();
          try {
            employeeService.create(new EmployeeRequest(username, "Concurrent", ORIGINAL, null, "shared@example.test", null, null, null));
            return true;
          } catch (ApiException | org.springframework.dao.DataIntegrityViolationException e) { return false; }
        }));
      }
      start.countDown();
      int successes = 0;
      for (var job : jobs) if (job.get(15, TimeUnit.SECONDS)) successes++;
      assertEquals(1, successes);
    } finally { pool.shutdownNow(); }
  }

  @Test void smsRecoveryIsRejected() throws Exception {
    mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json")
        .content("{\"username\":\"RECOVERY\",\"channel\":\"SMS\"}"))
        .andExpect(status().isBadRequest());
    verify(delivery, never()).send(anyString(), anyString(), anyString());
  }

  @Test void unrelatedProfileUpdatePreservesEmailAndBlankEmailIsRejected() {
    employeeService.update(employeeId, new EmployeeUpdate("Updated User", "ACTIVE", null, null, null, null, null));
    assertEquals("worker@example.test", employees.findById(employeeId).orElseThrow().email);
    assertThrows(ApiException.class, () -> employeeService.update(employeeId,
        new EmployeeUpdate("Updated User", "ACTIVE", null, " ", null, null, null)));
    assertEquals("worker@example.test", employees.findById(employeeId).orElseThrow().email);
  }

  @Test void emailResetIsHashedSingleUseAndRevokesExistingSessions() throws Exception {
    var firstSession = login(ORIGINAL);
    var secondSession = login(ORIGINAL);
    var response = request("RECOVERY", "EMAIL");
    String id = response.path("requestId").asText(), code = code("EMAIL", "worker@example.test");
    var stored = resets.findById(id).orElseThrow();
    assertNotEquals(code, stored.codeHash);
    assertTrue(encoder.matches(code, stored.codeHash));
    assertFalse(response.has("code"));
    assertFalse(response.has("otp"));
    reset(id, code.equals("000000") ? "111111" : "000000", 400);
    assertEquals(1, resets.findById(id).orElseThrow().attempts);
    reset(id, code, 200);
    reset(id, code, 400);
    mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(Map.of("username", "RECOVERY", "password", ORIGINAL))))
        .andExpect(status().isUnauthorized());
    login(NEW);
    mvc.perform(get("/api/auth/me").session(firstSession)).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/auth/me").session(secondSession)).andExpect(status().isUnauthorized());
  }

  @Test void unknownOrMissingEmailHaveSameResponse() throws Exception {
    var known = request("RECOVERY", "EMAIL");
    code("EMAIL", "worker@example.test");
    clearInvocations(delivery);
    var unknown = request("UNKNOWN", "EMAIL");
    var employee = employees.findById(employeeId).orElseThrow();
    employee.email = null; employees.save(employee);
    time.set(time.get().plusSeconds(61));
    var mismatch = request("RECOVERY", "EMAIL");
    assertEquals(known.path("message"), unknown.path("message"));
    assertEquals(known.path("message"), mismatch.path("message"));
    assertEquals(known.properties().stream().map(Map.Entry::getKey).sorted().toList(),
        unknown.properties().stream().map(Map.Entry::getKey).sorted().toList());
    verify(delivery, never()).send(anyString(), anyString(), anyString());
    assertNull(resets.findById(unknown.path("requestId").asText()).orElseThrow().accountId);
  }

  @Test void expiredCodesAreRejected() throws Exception {
    var result = request("RECOVERY", "EMAIL");
    String code = code("EMAIL", "worker@example.test");
    time.set(time.get().plusSeconds(600));
    reset(result.path("requestId").asText(), code, 400);
    login(ORIGINAL);
  }

  @Test void fiveWrongAttemptsLockTheCode() throws Exception {
    var result = request("RECOVERY", "EMAIL");
    String id = result.path("requestId").asText(), code = code("EMAIL", "worker@example.test");
    for (int i = 0; i < 5; i++) reset(id, code.equals("000000") ? "111111" : "000000", 400);
    assertEquals(5, resets.findById(id).orElseThrow().attempts);
    reset(id, code, 400);
    login(ORIGINAL);
  }

  @Test void requestCooldownAndRateLimitApplyToUnknownAccountsToo() throws Exception {
    var body = new RecoveryRequest("UNKNOWN", "EMAIL");
    request(body.username(), body.channel());
    mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json").content(mapper.writeValueAsString(body)))
        .andExpect(status().isTooManyRequests());
    for (int i = 0; i < 2; i++) {
      time.set(time.get().plusSeconds(61));
      request(body.username(), body.channel());
    }
    time.set(time.get().plusSeconds(61));
    mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json").content(mapper.writeValueAsString(body)))
        .andExpect(status().isTooManyRequests());
  }

  @Test void ipLimitPreventsRequestsAcrossManyUsernames() throws Exception {
    for (int i = 0; i < 10; i++) request("UNKNOWN" + i, "EMAIL");
    mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(new RecoveryRequest("UNKNOWN11", "EMAIL"))))
        .andExpect(status().isTooManyRequests());
  }

  @Test void unavailableChannelIsReportedWithoutPretendingToSend() throws Exception {
    when(delivery.available(anyString())).thenReturn(false);
    mvc.perform(get(BASE + "/options")).andExpect(jsonPath("$.emailEnabled").value(false));
    mvc.perform(post(BASE + "/request").with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(new RecoveryRequest("RECOVERY", "EMAIL"))))
        .andExpect(status().isServiceUnavailable());
    verify(delivery, never()).send(anyString(), anyString(), anyString());
  }

  @Test void changedContactInvalidatesPreviouslyIssuedCode() throws Exception {
    var result = request("RECOVERY", "EMAIL");
    String code = code("EMAIL", "worker@example.test");
    var employee = employees.findById(employeeId).orElseThrow();
    employee.email = "new@example.test"; employees.save(employee);
    reset(result.path("requestId").asText(), code, 400);
  }

  @Test void inactiveEmployeesReceiveNoCode() throws Exception {
    var employee = employees.findById(employeeId).orElseThrow();
    employee.status = "INACTIVE"; employees.save(employee);
    request("RECOVERY", "EMAIL");
    verify(delivery, never()).send(anyString(), anyString(), anyString());
  }

  @Test void unlinkedAdminDoesNotReceiveEmployeeRecoveryCodes() throws Exception {
    var admin = new Account();
    admin.username = "admin"; admin.passwordHash = encoder.encode(ORIGINAL);
    admin.role = "MANAGER"; admin.enabled = true; admin.createdAt = LocalDateTime.now();
    accounts.save(admin);
    var result = request("admin", "EMAIL");
    assertNull(resets.findById(result.path("requestId").asText()).orElseThrow().accountId);
    verify(delivery, never()).send(anyString(), anyString(), anyString());
  }

  @Test void changingPasswordInvalidatesOutstandingCodes() throws Exception {
    var result = request("RECOVERY", "EMAIL");
    String code = code("EMAIL", "worker@example.test");
    var account = accounts.findByUsername("RECOVERY").orElseThrow();
    account.passwordHash = encoder.encode("AnotherPassword789"); accounts.save(account);
    reset(result.path("requestId").asText(), code, 400);
  }

  @Test void concurrentRedemptionsAllowOnlyOnePasswordChange() throws Exception {
    var result = request("RECOVERY", "EMAIL");
    var body = new ResetPasswordRequest(result.path("requestId").asText(), code("EMAIL", "worker@example.test"), NEW);
    var pool = Executors.newFixedThreadPool(2);
    try {
      Callable<Boolean> task = () -> { try { recovery.reset(body); return true; } catch (ApiException e) { return false; } };
      var outcomes = pool.invokeAll(List.of(task, task));
      assertEquals(1, outcomes.stream().filter(future -> {try {return future.get();} catch (Exception e) {throw new RuntimeException(e);}}).count());
    } finally { pool.shutdownNow(); }
  }
}
