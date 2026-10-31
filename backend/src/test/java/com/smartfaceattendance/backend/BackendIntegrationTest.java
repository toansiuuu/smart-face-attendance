package com.smartfaceattendance.backend;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import com.smartfaceattendance.backend.service.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:attendance;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
      "spring.datasource.username=sa",
      "spring.datasource.password=",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.jpa.hibernate.ddl-auto=none",
      "spring.sql.init.mode=always",
      "spring.sql.init.schema-locations=classpath:schema-test.sql",
      "app.liveness-url=",
      "app.liveness-secret=",
      "app.working-days=MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY"
    })
@AutoConfigureMockMvc
class BackendIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate jdbc;
  @Autowired AccountRepository accounts;
  @Autowired EmployeeRepository employees;
  @Autowired EmployeeService employeeService;
  @Autowired ShiftService shiftService;
  @Autowired AttendanceService attendance;
  @Autowired CorrectionService corrections;
  @Autowired PasswordEncoder encoder;
  LocalDate today;
  Account manager;

  @BeforeEach
  void setup() {
    for (String t :
        List.of(
            "correction_requests",
            "attendance_events",
            "face_enrollments",
            "shift_milestones",
            "user_accounts",
            "employees",
            "shifts")) jdbc.update("DELETE FROM " + t);
    today = attendance.now().toLocalDate();
    manager = new Account();
    manager.username = "admin";
    manager.passwordHash = encoder.encode("ValidPassword123");
    manager.enabled = true;
    manager.role = "MANAGER";
    manager.createdAt = attendance.now();
    accounts.save(manager);
  }

  void schedule() {
    shiftService.create(
        new ShiftRequest(
            "STANDARD",
            "Standard",
            today.minusDays(1),
            List.of(
                new MilestoneRequest(
                    "MORNING_IN", LocalTime.of(8, 0), LocalTime.of(0, 0), LocalTime.of(10, 59)),
                new MilestoneRequest(
                    "LUNCH_OUT", LocalTime.of(12, 0), LocalTime.of(11, 0), LocalTime.of(12, 59)),
                new MilestoneRequest(
                    "AFTERNOON_IN", LocalTime.of(13, 0), LocalTime.of(13, 0), LocalTime.of(14, 59)),
                new MilestoneRequest(
                    "WORK_OUT", LocalTime.of(17, 0), LocalTime.of(15, 0), LocalTime.of(23, 59)))));
  }

  Long employee(String code) {
    return employeeService
        .create(new EmployeeRequest(code, "Test Employee", "ValidPassword123", null, null, null, null, null, null))
        .id();
  }

  MockHttpSession login(String username) throws Exception {
    return (MockHttpSession)
        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .contentType("application/json")
                    .content(
                        "{\"username\":\"" + username + "\",\"password\":\"ValidPassword123\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getRequest()
            .getSession(false);
  }

  @Test
  void unauthenticatedAccessRejected() throws Exception {
    mvc.perform(get("/api/employees")).andExpect(status().isUnauthorized());
  }

  @Test
  void loginPersistsSessionAndLogoutInvalidates() throws Exception {
    var session = login("admin");
    mvc.perform(get("/api/auth/me").session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("MANAGER"));
    mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isOk());
    assertTrue(session.isInvalid());
  }

  @Test
  void loginRequiresCsrfAndCorrectPassword() throws Exception {
    mvc.perform(
            post("/api/auth/login")
                .contentType("application/json")
                .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .contentType("application/json")
                .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void employeeCannotManageAndCannotReadOthers() throws Exception {
    schedule();
    employee("ONE");
    Long other = employee("TWO");
    var session = login("ONE");
    mvc.perform(get("/api/employees").session(session)).andExpect(status().isForbidden());
    mvc.perform(
            get("/api/attendance")
                .param("from", today.toString())
                .param("to", today.toString())
                .param("employeeId", other.toString())
                .session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].empId").value("ONE"));
  }

  @Test
  void inactiveEmployeeSessionCannotAccess() throws Exception {
    Long id = employee("ONE");
    var session = login("ONE");
    employeeService.update(id, new EmployeeUpdate("Test Employee", "INACTIVE", null, null, null, null, null, null));
    mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
  }

  @Test
  void duplicateEmployeeDoesNotCreateExtraAccount() {
    employee("ONE");
    assertThrows(ApiException.class, () -> employee("ONE"));
    assertEquals(1, employees.count());
    assertEquals(2, accounts.count());
  }

  @Test
  void originalDatabaseRejectsEmployeeAccountWithoutEmployee() {
    Account a = new Account();
    a.username = "invalid";
    a.passwordHash = "x";
    a.role = "EMPLOYEE";
    a.enabled = true;
    a.createdAt = attendance.now();
    assertThrows(Exception.class, () -> accounts.saveAndFlush(a));
  }

  @Test
  void duplicateConcurrentScansKeepOneRecord() throws Exception {
    schedule();
    Long id = employee("ONE");
    var start = new CountDownLatch(1);
    var pool = Executors.newFixedThreadPool(2);
    try {
      Callable<Boolean> call =
          () -> {
            start.await();
            try {
              attendance.record(id, today.atTime(8, 0), null);
              return true;
            } catch (ApiException e) {
              assertEquals(409, e.status);
              return false;
            }
          };
      var a = pool.submit(call);
      var b = pool.submit(call);
      start.countDown();
      assertNotEquals(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
      assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM attendance_events", Integer.class));
    } finally {
      pool.shutdownNow();
    }
  }

  @Test
  void scanWindowsAndChronologyEnforced() {
    schedule();
    Long id = employee("ONE");
    assertEquals("MORNING_IN", attendance.record(id, today.atTime(8, 0), null).eventType);
    assertThrows(ApiException.class, () -> attendance.record(id, today.atTime(7, 0), "LUNCH_OUT"));
  }

  @Test
  void approvedCorrectionOverlaysRawAndCannotBeReviewedTwice() {
    schedule();
    Long id = employee("ONE");
    var account = accounts.findByEmployeeId(id).orElseThrow();
    attendance.record(id, today.atTime(0, 1), "MORNING_IN");
    corrections.create(
        account,
        new CorrectionRequest(today, "MORNING_IN", LocalTime.MIDNIGHT, "Clock correction"));
    Long request = jdbc.queryForObject("SELECT id FROM correction_requests", Long.class);
    corrections.review(manager, request, new ReviewRequest(true, "Accepted"));
    assertEquals(today.atStartOfDay(), attendance.effective(id, today).get("MORNING_IN"));
    assertEquals(today.atTime(0, 1), attendance.raw(id, today).get("MORNING_IN"));
    assertThrows(
        ApiException.class,
        () -> corrections.review(manager, request, new ReviewRequest(false, "Again")));
  }

  @Test
  void noScheduleReturnsActionableConflict() {
    Long id = employee("ONE");
    assertThrows(ApiException.class, () -> attendance.record(id, attendance.now(), null));
  }

  @Test
  void workedTimeExcludesLunchAndIncompletePairs() {
    var times = new HashMap<String, LocalDateTime>();
    times.put("MORNING_IN", today.atTime(8, 0));
    times.put("LUNCH_OUT", today.atTime(12, 0));
    times.put("AFTERNOON_IN", today.atTime(13, 0));
    assertEquals(240, AttendanceMath.workedMinutes(times));
    times.put("WORK_OUT", today.atTime(17, 0));
    assertEquals(480, AttendanceMath.workedMinutes(times));
  }

  @Test
  void browserCsrfTokenAndSessionWorkWithoutTestToken() throws Exception {
    var response = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
    var json =
        new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(response.getResponse().getContentAsString());
    var session = (MockHttpSession) response.getRequest().getSession(false);
    var logged =
        mvc.perform(
                post("/api/auth/login")
                    .session(session)
                    .header(json.get("headerName").asText(), json.get("token").asText())
                    .contentType("application/json")
                    .content("{\"username\":\"admin\",\"password\":\"ValidPassword123\"}"))
            .andExpect(status().isOk())
            .andReturn();
    assertTrue(session.isInvalid());
    var authenticated = (MockHttpSession) logged.getRequest().getSession(false);
    mvc.perform(get("/api/auth/me").session(authenticated)).andExpect(status().isOk());
  }

  @Test
  void enrollmentRemainsManagerOnly() throws Exception {
    Long id = employee("ONE");
    String path = "/api/employees/" + id + "/face-enrollment";
    String body = "{\"image\":\"data:image/jpeg;base64,/9j/2Q==\"}";
    mvc.perform(post(path).with(csrf()).contentType("application/json").content(body))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post(path)
                .session(login("ONE"))
                .with(csrf())
                .contentType("application/json")
                .content(body))
        .andExpect(status().isForbidden());
  }

  @Test
  void publicCameraCanFetchCsrfAndScanWithoutLogin() throws Exception {
    var response = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
    var json =
        new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(response.getResponse().getContentAsString());
    var session = (MockHttpSession) response.getRequest().getSession(false);
    mvc.perform(
            post("/api/diem-danh")
                .session(session)
                .header(json.get("headerName").asText(), json.get("token").asText())
                .contentType("application/json")
                .content("{\"anhKhuonMat\":\"data:image/jpeg;base64,/9j/2Q==\"}"))
        .andExpect(status().isServiceUnavailable());
    assertNull(session.getAttribute("SPRING_SECURITY_CONTEXT"));
    mvc.perform(get("/api/employees").session(session)).andExpect(status().isUnauthorized());
  }

  @Test
  void publicCameraStillRequiresCsrf() throws Exception {
    mvc.perform(
            post("/api/diem-danh")
                .contentType("application/json")
                .content("{\"anhKhuonMat\":\"data:image/jpeg;base64,/9j/2Q==\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void recognitionNotConfiguredNeverRecordsAttendance() throws Exception {
    mvc.perform(
            post("/api/diem-danh")
                .with(csrf())
                .contentType("application/json")
                .content("{\"anhKhuonMat\":\"data:image/jpeg;base64,/9j/2Q==\"}"))
        .andExpect(status().isServiceUnavailable());
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM attendance_events", Integer.class));
  }

  @Test
  void standaloneLivenessRequiresManagerAndCsrfAndWritesNothing() throws Exception {
    employee("LIVENESS");
    var body = "{\"image\":\"data:image/jpeg;base64,/9j/2Q==\"}";
    mvc.perform(post("/api/face/liveness").with(csrf())
        .contentType("application/json").content(body)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/face/liveness").session(login("LIVENESS")).with(csrf())
        .contentType("application/json").content(body)).andExpect(status().isForbidden());
    var managerSession = login("admin");
    mvc.perform(post("/api/face/liveness").session(managerSession)
        .contentType("application/json").content(body)).andExpect(status().isForbidden());
    mvc.perform(post("/api/face/liveness").session(managerSession).with(csrf())
        .contentType("application/json").content(body)).andExpect(status().isServiceUnavailable());
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM attendance_events", Integer.class));
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM face_enrollments", Integer.class));
  }

  @Test
  void concurrentReviewsAcceptOnlyOneDecision() throws Exception {
    schedule();
    Long id = employee("ONE");
    corrections.create(
        accounts.findByEmployeeId(id).orElseThrow(),
        new CorrectionRequest(today, "MORNING_IN", LocalTime.MIDNIGHT, "Missing scan"));
    Long request = jdbc.queryForObject("SELECT id FROM correction_requests", Long.class);
    var start = new CountDownLatch(1);
    var pool = Executors.newFixedThreadPool(2);
    try {
      Callable<Boolean> review =
          () -> {
            start.await();
            try {
              corrections.review(manager, request, new ReviewRequest(true, "Approved"));
              return true;
            } catch (ApiException ex) {
              assertEquals(409, ex.status);
              return false;
            }
          };
      var a = pool.submit(review);
      var b = pool.submit(review);
      start.countDown();
      assertNotEquals(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
    } finally {
      pool.shutdownNow();
    }
  }
}
