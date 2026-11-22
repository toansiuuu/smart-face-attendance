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
  @Autowired com.fasterxml.jackson.databind.ObjectMapper mapper;
  @Autowired JdbcTemplate jdbc;
  @Autowired AccountRepository accounts;
  @Autowired EmployeeRepository employees;
  @Autowired EmployeeService employeeService;
  @Autowired ShiftService shiftService;
  @Autowired AttendanceService attendance;
  @Autowired AttendanceReportService reports;
  @Autowired CorrectionService corrections;
  @Autowired CorrectionAttachments correctionAttachments;
  @Autowired AttendanceEventRepository attendanceEvents;
  @Autowired CorrectionRepository correctionRecords;
  @Autowired ShiftRepository shiftRecords;
  @Autowired MilestoneRepository milestoneRecords;
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
                    "WORK_OUT", LocalTime.of(17, 0), LocalTime.of(15, 0), LocalTime.of(23, 59))), List.of(DayOfWeek.values())));
  }

  Long employee(String code) {
    return employeeService
        .create(new EmployeeRequest(code, "Test Employee", "ValidPassword123", null, code + "@example.test", null, null, null))
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
  void managerCanEditAndReactivateSameProfileWithoutLosingFaceOrAttendance() throws Exception {
    schedule();
    Long id = reportingEmployee("RESTOREPROFILE");
    var date = today.minusDays(1);
    var event = attendance.record(id, date.atTime(8, 0), null);
    var employee = employees.findById(id).orElseThrow();
    var originalCreatedAt = employee.createdAt;
    var account = accounts.findByEmployeeId(id).orElseThrow();
    String originalHash = account.passwordHash;
    Long accountId = account.id;
    var face = new FaceEnrollment();
    face.employeeId = id; face.externalRef = "employee-" + id; face.modelVersion = "test-sface";
    face.active = true; face.enrolledAt = date.atTime(7, 0);
    jdbc.update("INSERT INTO face_enrollments (employee_id, external_ref, model_version, active, enrolled_at) VALUES (?, ?, ?, ?, ?)",
        face.employeeId, face.externalRef, face.modelVersion, face.active, face.enrolledAt);
    employeeService.update(id, new EmployeeUpdate("Test Employee", "INACTIVE", null, null, null, null, null));
    mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
        .content("{\"username\":\"RESTOREPROFILE\",\"password\":\"ValidPassword123\"}"))
        .andExpect(status().isUnauthorized());
    var update = new EmployeeUpdate("Nguyễn Văn An", "ACTIVE", "0987654321", "new-contact@example.test",
        "Kỹ sư", LocalDate.of(2000, 1, 2), "MALE");
    mvc.perform(patch("/api/employees/" + id).session(login("admin")).with(csrf()).contentType("application/json")
        .content(mapper.writeValueAsString(update))).andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(id)).andExpect(jsonPath("$.empId").value("RESTOREPROFILE"))
        .andExpect(jsonPath("$.email").value("new-contact@example.test"))
        .andExpect(jsonPath("$.phone").value("0987654321"))
        .andExpect(jsonPath("$.hasFaceData").value(true))
        .andExpect(jsonPath("$.workStatus").value("Đang làm việc"));
    var saved = employees.findById(id).orElseThrow();
    assertEquals(originalCreatedAt, saved.createdAt);
    assertEquals(LocalDate.of(2000, 1, 2), saved.dateOfBirth);
    assertEquals("Kỹ sư", saved.position);
    var restored = accounts.findByEmployeeId(id).orElseThrow();
    assertEquals(accountId, restored.id); assertEquals(originalHash, restored.passwordHash);
    assertEquals("RESTOREPROFILE", restored.username); assertTrue(restored.enabled);
    assertTrue(attendanceEvents.existsById(event.id));
    assertEquals("08:00", attendance.day(saved, date).milestones().get("MORNING_IN"));
    mvc.perform(get("/api/auth/me").session(login("RESTOREPROFILE"))).andExpect(status().isOk());
  }

  @Test
  void profileEditingIsManagerOnlyAndValidatesFullForm() throws Exception {
    Long id = employee("EDITAUTH");
    var body = new EmployeeUpdate("Valid Name", "ACTIVE", "0912345678", "valid@example.test", null, null, null);
    String url = "/api/employees/" + id;
    mvc.perform(patch(url).with(csrf()).contentType("application/json").content(mapper.writeValueAsString(body)))
        .andExpect(status().isUnauthorized());
    mvc.perform(patch(url).session(login("EDITAUTH")).with(csrf()).contentType("application/json").content(mapper.writeValueAsString(body)))
        .andExpect(status().isForbidden());
    var managerSession = login("admin");
    for (var invalid : List.of(
        new EmployeeUpdate("123", "ACTIVE", null, "valid@example.test", null, null, null),
        new EmployeeUpdate("Valid Name", "ACTIVE", "abc", "valid@example.test", null, null, null),
        new EmployeeUpdate("Valid Name", "ACTIVE", null, "", null, null, null),
        new EmployeeUpdate("Valid Name", "ACTIVE", null, "invalid", null, null, null),
        new EmployeeUpdate("Valid Name", "ACTIVE", null, "valid@example.test", " ", null, null),
        new EmployeeUpdate("Valid Name", "ACTIVE", null, "valid@example.test", null, today.plusDays(1), null),
        new EmployeeUpdate("Valid Name", "ACTIVE", null, "valid@example.test", null, null, "UNKNOWN")))
      mvc.perform(patch(url).session(managerSession).with(csrf()).contentType("application/json").content(mapper.writeValueAsString(invalid)))
          .andExpect(status().isBadRequest());
    assertEquals("Test Employee", employees.findById(id).orElseThrow().fullName);
    assertEquals("EDITAUTH@example.test".toLowerCase(Locale.ROOT), employees.findById(id).orElseThrow().email);
  }

  private AttendanceService reportingClock(LocalDateTime instant) {
    return new AttendanceService(employees, attendanceEvents, correctionRecords, shiftService, 0) {
      @Override public LocalDateTime now() { return instant; }
    };
  }

  private Long reportingEmployee(String code) {
    Long id = employee(code);
    var e = employees.findById(id).orElseThrow();
    e.createdAt = today.minusDays(10).atStartOfDay();
    employees.saveAndFlush(e);
    return id;
  }

  private void reportingCorrection(Long id, LocalDate date, String type, LocalTime time, String status) {
    var c = new Correction();
    c.employeeId = id; c.workDate = date; c.shiftId = shiftService.applicable(date).id;
    c.eventType = type; c.proposedOccurredAt = date.atTime(time); c.reason = "Report test correction";
    c.status = status; c.requestedByAccountId = accounts.findByEmployeeId(id).orElseThrow().id;
    c.createdAt = attendance.now();
    if (status.equals("APPROVED")) {c.reviewedAt = attendance.now(); c.reviewedByAccountId = manager.id;}
    correctionRecords.saveAndFlush(c);
  }

  @Test
  void reportsCountOverlappingFlagsAndUseOnlyApprovedCorrections() {
    schedule();
    Long id = reportingEmployee("REPORT1");
    reportingEmployee("REPORT2");
    var date = today.minusDays(1);
    attendance.record(id, date.atTime(8, 30), null);
    attendance.record(id, date.atTime(11, 45), null);
    attendance.record(id, date.atTime(13, 0), null);
    var before = reports.summary(null, date, date);
    assertEquals(1, before.totals().lateDays());
    assertEquals(1, before.totals().earlyDays());
    assertEquals(1, before.totals().incompleteDays());
    assertEquals(1, before.totals().absentDays());
    assertEquals(195, before.totals().workedMinutes());
    assertEquals(50.0, before.totals().attendanceRate());
    reportingCorrection(id, date, "MORNING_IN", LocalTime.of(8, 0), "APPROVED");
    reportingCorrection(id, date, "LUNCH_OUT", LocalTime.NOON, "PENDING");
    reportingCorrection(id, date, "WORK_OUT", LocalTime.of(17, 0), "APPROVED");
    var report = reports.summary(null, date, date);
    assertEquals(0, report.totals().lateDays());
    assertEquals(1, report.totals().earlyDays());
    assertEquals(0, report.totals().incompleteDays());
    assertEquals(1, report.totals().completeDays());
    assertEquals(465, report.totals().workedMinutes());
    assertEquals(1, report.totals().correctedDays());
    var row = report.details().stream().filter(d -> d.employeeId().equals(id)).findFirst().orElseThrow();
    assertEquals("08:30", row.rawMilestones().get("MORNING_IN"));
    assertEquals("08:00", row.milestones().get("MORNING_IN"));
    assertEquals("11:45", row.milestones().get("LUNCH_OUT"));
    var filtered = reports.summary(id, date, date);
    assertEquals(1, filtered.employeeCount());
    assertEquals(100.0, filtered.totals().attendanceRate());
    assertEquals(report.totals().workedMinutes(), report.byDate().get(0).totals().workedMinutes());
    assertEquals(report.totals().presentDays(), report.byEmployee().stream().mapToLong(e -> e.totals().presentDays()).sum());
  }

  @Test
  void reportsDoNotTreatUnknownCalendarsOrNonWorkingDaysAsAbsences() {
    Long id = reportingEmployee("REPORTCAL");
    var date = today.minusDays(1);
    var unknown = reports.summary(id, date, date);
    assertEquals(1, unknown.totals().unconfiguredDays());
    assertEquals(0, unknown.totals().absentDays());
    assertNull(unknown.totals().attendanceRate());
    schedule();
    String days = Arrays.stream(DayOfWeek.values()).filter(d -> d != date.getDayOfWeek())
        .map(DayOfWeek::name).collect(java.util.stream.Collectors.joining(","));
    jdbc.update("UPDATE shift_working_day_policy SET working_days = ?", days);
    var off = reports.summary(id, date, date);
    assertEquals(1, off.totals().offDays());
    assertEquals(0, off.totals().absentDays());
    assertNull(off.totals().attendanceRate());
  }

  @Test
  void reportsKeepCurrentUnscannedDayPendingAndCheckGraceWithSeconds() {
    schedule(); Long id = reportingEmployee("REPORTTIME");
    var clock = reportingClock(today.atTime(12, 0));
    var service = new AttendanceReportService(clock, employees);
    var pending = service.summary(id, today, today);
    assertEquals(1, pending.totals().pendingDays());
    assertEquals(0, pending.totals().absentDays());
    assertNull(pending.totals().attendanceRate());
    attendance.record(id, today.atTime(8, 0, 1), null);
    assertEquals(1, service.summary(id, today, today).totals().lateDays());
    var withGrace = new AttendanceService(employees, attendanceEvents, correctionRecords, shiftService, 1) {
      @Override public LocalDateTime now() {return today.atTime(12, 0);}
    };
    assertEquals(0, new AttendanceReportService(withGrace, employees).summary(id, today, today).totals().lateDays());
  }

  @Test
  void reportsPreserveHistoricalScheduleEvenWhenLaterVersionExists() {
    schedule(); Long id = reportingEmployee("REPORTHISTORY");
    var date = today.minusDays(1);
    attendance.record(id, date.atTime(8, 30), null);
    var version = new Shift(); version.shiftCode = "NEXT"; version.shiftName = "Next version";
    version.effectiveFrom = today; shiftRecords.saveAndFlush(version);
    jdbc.update("INSERT INTO shift_working_day_policy (shift_id, working_days) VALUES (?, ?)", version.id, today.getDayOfWeek().name());
    var report = reports.summary(id, date, today);
    var old = report.details().stream().filter(d -> d.date().equals(date)).findFirst().orElseThrow();
    assertTrue(old.late());
    assertNotEquals(version.id, old.shiftId());
  }

  @Test
  void reportsEnforceRangeAndDoNotInventPreEmploymentOrInactiveDays() {
    schedule(); Long id = employee("REPORTNEW");
    var date = today.minusDays(1);
    var empty = reports.summary(id, date, date);
    assertEquals(0, empty.details().size());
    assertEquals(1, empty.byDate().size());
    assertEquals(1, empty.byEmployee().size());
    var e = employees.findById(id).orElseThrow(); e.status = "INACTIVE"; employees.saveAndFlush(e);
    assertTrue(reports.summary(id, today, today).details().isEmpty());
    assertEquals(400, assertThrows(ApiException.class, () -> reports.summary(null, today, date)).status);
    assertEquals(400, assertThrows(ApiException.class, () -> reports.summary(null, today, today.plusDays(1))).status);
    assertEquals(400, assertThrows(ApiException.class, () -> reports.summary(null, today.minusDays(367), today)).status);
    assertEquals(367, reports.summary(null, today.minusDays(366), today).byDate().size());
    assertEquals(404, assertThrows(ApiException.class, () -> reports.summary(Long.MAX_VALUE, today, today)).status);
  }

  @Test
  void reportingEndpointIsManagerOnlyAndDoesNotCachePersonalData() throws Exception {
    employee("REPORTAUTH");
    String url = "/api/reports/attendance?from=" + today + "&to=" + today;
    mvc.perform(get(url)).andExpect(status().isUnauthorized());
    mvc.perform(get(url).session(login("REPORTAUTH"))).andExpect(status().isForbidden());
    mvc.perform(get(url).session(login("admin"))).andExpect(status().isOk())
        .andExpect(header().string("Cache-Control", "no-store"))
        .andExpect(jsonPath("$.employeeCount").value(1))
        .andExpect(jsonPath("$.totals.unconfiguredDays").value(1))
        .andExpect(jsonPath("$.byDate[0].date").value(today.toString()));
    mvc.perform(get("/api/reports/attendance?from=bad&to=" + today).session(login("admin")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void loginAcceptsUsernameCaseAndSurroundingSpaces() throws Exception {
    mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
        .content("{\"username\":\" ADMIN \",\"password\":\"ValidPassword123\"}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("admin"));
  }

  @Test
  void legacyDuplicateContactsDoNotBlockDisableOrRename() {
    Long first = employeeService.create(new EmployeeRequest("LEGACY1", "First User", "ValidPassword123", "0912345678", "first@example.test", null, null, null)).id();
    Long second = employeeService.create(new EmployeeRequest("LEGACY2", "Second User", "ValidPassword123", "0987654321", "second@example.test", null, null, null)).id();
    jdbc.execute("ALTER TABLE employees DROP CONSTRAINT uq_employees_email");
    jdbc.execute("ALTER TABLE employees DROP CONSTRAINT uq_employees_phone");
    try {
      jdbc.update("UPDATE employees SET email = ?, phone = ? WHERE id = ?", "FIRST@EXAMPLE.TEST", "0912345678", second);
      employeeService.update(second, new EmployeeUpdate("Renamed User", "INACTIVE", "0912345678", "FIRST@EXAMPLE.TEST", null, null, null));
      assertFalse(accounts.findByEmployeeId(second).orElseThrow().enabled);
      assertEquals("Renamed User", employees.findById(second).orElseThrow().fullName);
      assertTrue(accounts.findByEmployeeId(first).orElseThrow().enabled);
      assertEquals(409, assertThrows(ApiException.class, () -> employeeService.create(new EmployeeRequest(
          "LEGACY3", "Third User", "ValidPassword123", null, "first@example.test", null, null, null))).status);
    } finally {
      jdbc.update("UPDATE employees SET email = ?, phone = ? WHERE id = ?", "second@example.test", "0987654321", second);
      jdbc.execute("ALTER TABLE employees ADD CONSTRAINT uq_employees_email UNIQUE (email)");
      jdbc.execute("ALTER TABLE employees ADD CONSTRAINT uq_employees_phone UNIQUE (phone)");
    }
  }

  @Test
  void approvedMissingMilestoneCannotBeOverwrittenByLaterRawScan() {
    schedule();
    Long id = employee("APPROVEDSCAN");
    corrections.create(accounts.findByEmployeeId(id).orElseThrow(), new CorrectionRequest(today, "MORNING_IN", LocalTime.MIDNIGHT, "Missing morning scan"));
    Long requestId = jdbc.queryForObject("SELECT id FROM correction_requests", Long.class);
    corrections.review(manager, requestId, new ReviewRequest(true, "Confirmed"));
    assertEquals(409, assertThrows(ApiException.class, () -> attendance.record(id, today.atTime(8, 0), null)).status);
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM attendance_events", Integer.class));
    assertEquals(today.atStartOfDay(), attendance.effective(id, today).get("MORNING_IN"));
  }

  @Test
  void avatarValidatesActualBytesAndUsesUniqueName() throws Exception {
    Long id = employee("AVATAR");
    var fake = new org.springframework.mock.web.MockMultipartFile("file", "fake.jpg", "image/jpeg", "not an image".getBytes());
    assertEquals(400, assertThrows(ApiException.class, () -> employeeService.uploadAvatar(id, fake)).status);
    assertNull(employees.findById(id).orElseThrow().avatarUrl);
    var image = new java.awt.image.BufferedImage(4, 4, java.awt.image.BufferedImage.TYPE_INT_RGB);
    var bytes = new java.io.ByteArrayOutputStream();
    javax.imageio.ImageIO.write(image, "png", bytes);
    var valid = new org.springframework.mock.web.MockMultipartFile("file", "../../unsafe.png", "application/octet-stream", bytes.toByteArray());
    employeeService.uploadAvatar(id, valid);
    String url = employees.findById(id).orElseThrow().avatarUrl;
    assertTrue(url.matches("/uploads/avatars/" + id + "-[a-f0-9-]+\\.png"));
    employeeService.uploadAvatar(id, valid);
    assertNotEquals(url, employees.findById(id).orElseThrow().avatarUrl);
    assertFalse(java.nio.file.Files.exists(java.nio.file.Path.of("uploads", url.substring("/uploads/".length()))));
  }

  @Test
  void concurrentPasswordChangesWithOldPasswordAllowOnlyOneWinner() throws Exception {
    var firstSession = login("admin");
    var secondSession = login("admin");
    var pool = Executors.newFixedThreadPool(2);
    var ready = new CountDownLatch(1);
    try {
      var jobs = new ArrayList<Future<Integer>>();
      int index = 0;
      for (var session : List.of(firstSession, secondSession)) {
        String password = "ChangedPassword" + (++index);
        jobs.add(pool.submit(() -> {
          ready.await();
          return mvc.perform(post("/api/auth/password").session(session).with(csrf()).contentType("application/json")
              .content("{\"currentPassword\":\"ValidPassword123\",\"newPassword\":\"" + password + "\"}"))
              .andReturn().getResponse().getStatus();
        }));
      }
      ready.countDown();
      var statuses = new ArrayList<Integer>();
      for (var job : jobs) statuses.add(job.get(15, TimeUnit.SECONDS));
      Collections.sort(statuses);
      assertEquals(List.of(200, 401), statuses);
    } finally { pool.shutdownNow(); }
  }

  @Test
  void weekdaysDistinguishAbsenceFromSaturdayAndSundayOff() {
    schedule();
    Long id = employee("WEEKDAYS");
    var shift = shiftService.applicable(today);
    jdbc.update("UPDATE shift_working_day_policy SET working_days = ? WHERE shift_id = ?", "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY", shift.id);
    LocalDate monday = today.minusWeeks(2).with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    jdbc.update("UPDATE shifts SET effective_from = ? WHERE id = ?", monday.minusDays(1), shift.id);
    var employee = employees.findById(id).orElseThrow();
    employee.createdAt = monday.atStartOfDay(); employees.saveAndFlush(employee);
    assertEquals("Vắng mặt", attendance.day(employee, monday).status());
    assertEquals("Ngày nghỉ", attendance.day(employee, monday.plusDays(5)).status());
    assertEquals("Ngày nghỉ", attendance.day(employee, monday.plusDays(6)).status());
    var error = assertThrows(ApiException.class, () -> attendance.record(id, monday.plusDays(6).atTime(8, 0), null));
    assertEquals(409, error.status);
    var report = attendance.report(id, monday, monday.plusDays(6));
    assertEquals(5, report.stream().filter(row -> row.status().equals("Vắng mặt")).count());
    assertEquals(2, report.stream().filter(row -> row.status().equals("Ngày nghỉ")).count());
  }

  @Test
  void selectedWeekendDaysAllowAttendance() {
    schedule();
    Long id = employee("WEEKEND");
    var shift = shiftService.applicable(today);
    jdbc.update("UPDATE shift_working_day_policy SET working_days = ? WHERE shift_id = ?", "SATURDAY,SUNDAY", shift.id);
    LocalDate saturday = today.with(java.time.temporal.TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY));
    assertEquals("MORNING_IN", attendance.record(id, saturday.atTime(8, 0), null).eventType);
    assertEquals("MORNING_IN", attendance.record(id, saturday.plusDays(1).atTime(8, 0), null).eventType);
  }

  @Test
  void absenceWaitsUntilAllScanWindowsHaveClosed() {
    schedule();
    Long id = employee("INPROGRESS");
    var employee = employees.findById(id).orElseThrow();
    var duringDay = new AttendanceService(employees, attendanceEvents, correctionRecords, shiftService, 0) {
      @Override public LocalDateTime now() { return today.atTime(12, 0); }
    };
    var afterDay = new AttendanceService(employees, attendanceEvents, correctionRecords, shiftService, 0) {
      @Override public LocalDateTime now() { return today.plusDays(1).atTime(0, 1); }
    };
    assertEquals("Đang diễn ra", duringDay.day(employee, today).status());
    assertEquals("Vắng mặt", afterDay.day(employee, today).status());
  }

  @Test
  void managerCanFillLegacyWeekdaysOnceButCannotRewriteSavedHistory() throws Exception {
    schedule(); employee("DAYUSER");
    Long id = shiftService.applicable(today).id;
    jdbc.update("DELETE FROM shift_working_day_policy WHERE shift_id = ?", id);
    var managerSession = login("admin");
    String path = "/api/shifts/" + id + "/working-days";
    mvc.perform(put(path).session(login("DAYUSER")).with(csrf()).contentType("application/json").content("{\"workingDays\":[\"MONDAY\"]}"))
        .andExpect(status().isForbidden());
    for (String days : List.of("[]", "[\"INVALID\"]", "[\"MONDAY\",\"MONDAY\"]", "[null]")) {
      mvc.perform(put(path).session(managerSession).with(csrf()).contentType("application/json").content("{\"workingDays\":" + days + "}"))
          .andExpect(status().isBadRequest());
    }
    mvc.perform(put(path).session(managerSession).with(csrf()).contentType("application/json").content("{\"workingDays\":[\"SATURDAY\",\"SUNDAY\"]}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.workingDaysSaved").value(true))
        .andExpect(jsonPath("$.workingDays[0]").value("SATURDAY"));
    mvc.perform(put(path).session(managerSession).with(csrf()).contentType("application/json").content("{\"workingDays\":[\"MONDAY\"]}"))
        .andExpect(status().isConflict());
    assertEquals(EnumSet.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY), shiftService.workingDays(id));
  }

  @Test
  void newVersionWeekdaysApplyOnlyFromItsEffectiveDate() {
    schedule();
    var original = shiftService.applicable(today);
    var points = shiftService.points(original.id).stream().map(point -> new MilestoneRequest(point.eventType, point.targetTime, point.windowStart, point.windowEnd)).toList();
    shiftService.create(new ShiftRequest("NEXT", "New weekdays", today.plusDays(1), points, List.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)));
    assertEquals(EnumSet.allOf(DayOfWeek.class), shiftService.workingDays(shiftService.applicable(today).id));
    assertEquals(EnumSet.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY), shiftService.workingDays(shiftService.applicable(today.plusDays(1)).id));
  }

  @Test
  void missingLegacyWeekdaysNeverInventAbsence() {
    schedule();
    Long id = employee("UNCONFIGURED");
    Long shiftId = shiftService.applicable(today).id;
    jdbc.update("DELETE FROM shift_working_day_policy WHERE shift_id = ?", shiftId);
    var unconfiguredShifts = new ShiftService(shiftRecords, milestoneRecords, jdbc, "");
    var service = new AttendanceService(employees, attendanceEvents, correctionRecords, unconfiguredShifts, 0) {
      @Override public LocalDateTime now() { return today.plusDays(1).atTime(0, 1); }
    };
    assertFalse(service.policyConfigured());
    assertEquals("Chưa có dữ liệu", service.day(employees.findById(id).orElseThrow(), today).status());
  }

  @Test
  void creatingScheduleRequiresWorkingWeekdays() throws Exception {
    schedule();
    var existing = shiftService.applicable(today);
    var points = shiftService.points(existing.id).stream().map(point -> new MilestoneRequest(point.eventType, point.targetTime, point.windowStart, point.windowEnd)).toList();
    var mapper = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
    for (List<DayOfWeek> days : java.util.Arrays.<List<DayOfWeek>>asList(null, List.of())) {
      var body = new ShiftRequest("MISSING", "Missing days", today.plusDays(1), points, days);
      mvc.perform(post("/api/shifts").session(login("admin")).with(csrf()).contentType("application/json").content(mapper.writeValueAsBytes(body)))
          .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.workingDays").exists());
    }
    assertEquals(1, shiftRecords.count());
  }

  @Test
  void invalidEmployeeFieldsReturnFieldErrorsAndDoNotCreateAccount() throws Exception {
    mvc.perform(post("/api/employees").session(login("admin")).with(csrf()).contentType("application/json")
        .content("{\"employeeCode\":\"BAD CODE!\",\"fullName\":\"12345\",\"password\":\"short\",\"phone\":\"abcdefghij\",\"email\":\"invalid\",\"gender\":\"INVALID\",\"dateOfBirth\":\"2999-01-01\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fields.employeeCode").exists())
        .andExpect(jsonPath("$.fields.fullName").exists())
        .andExpect(jsonPath("$.fields.password").exists())
        .andExpect(jsonPath("$.fields.phone").exists())
        .andExpect(jsonPath("$.fields.email").exists())
        .andExpect(jsonPath("$.fields.gender").exists())
        .andExpect(jsonPath("$.fields.dateOfBirth").exists());
    assertEquals(0, employees.count());
  }

  @Test
  void correctionOptionsUseApplicableScheduleAndShowPendingMilestones() throws Exception {
    schedule();
    Long id = employee("OPTIONS");
    var session = login("OPTIONS");
    mvc.perform(get("/api/corrections/options").param("workDate", today.toString()).session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.milestones.length()").value(4))
        .andExpect(jsonPath("$.milestones[0].eventType").value("MORNING_IN"))
        .andExpect(jsonPath("$.milestones[0].targetTime").value("08:00:00"));
    corrections.create(accounts.findByEmployeeId(id).orElseThrow(),
        new CorrectionRequest(today, "MORNING_IN", LocalTime.MIDNIGHT, "Missing attendance"));
    mvc.perform(get("/api/corrections/options").param("workDate", today.toString()).session(session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.milestones[0].pending").value(true));
    mvc.perform(get("/api/corrections/options").param("workDate", today.plusDays(1).toString()).session(session))
        .andExpect(status().isBadRequest());
  }

  @Test
  void attachmentsPersistWithCorrectionAndArePrivateToOwnerAndManager() throws Exception {
    schedule(); employee("OWNER"); employee("OTHER");
    var request = new org.springframework.mock.web.MockMultipartFile("request", "request.json", "application/json",
        ("{\"workDate\":\"" + today + "\",\"eventType\":\"MORNING_IN\",\"requestedTime\":\"00:00\",\"reason\":\"Missing clock scan\"}").getBytes(java.nio.charset.StandardCharsets.UTF_8));
    byte[] bytes = "%PDF-1.4\nTest attachment\n%%EOF".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    var file = new org.springframework.mock.web.MockMultipartFile("files", "evidence.pdf", "application/pdf", bytes);
    var session = login("OWNER");
    mvc.perform(multipart("/api/corrections").file(request).file(file).session(session).with(csrf()))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.attachments").value(1))
        .andExpect(jsonPath("$.attachmentFiles[0].name").value("evidence.pdf"));
    String url = jdbc.queryForObject("SELECT CONCAT('/api/corrections/',correction_id,'/attachments/',id) FROM correction_attachments", String.class);
    mvc.perform(get(url).session(session)).andExpect(status().isOk()).andExpect(content().bytes(bytes))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    mvc.perform(get(url).session(login("admin"))).andExpect(status().isOk());
    mvc.perform(get(url).session(login("OTHER"))).andExpect(status().isForbidden());
    mvc.perform(get(url)).andExpect(status().isUnauthorized());
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM attendance_events", Integer.class));
  }

  @Test
  void invalidAttachmentDoesNotLeaveCorrectionOrFile() throws Exception {
    schedule(); employee("OWNER");
    var request = new org.springframework.mock.web.MockMultipartFile("request", "request.json", "application/json",
        ("{\"workDate\":\"" + today + "\",\"eventType\":\"MORNING_IN\",\"requestedTime\":\"00:00\",\"reason\":\"Missing clock scan\"}").getBytes(java.nio.charset.StandardCharsets.UTF_8));
    var file = new org.springframework.mock.web.MockMultipartFile("files", "fake.pdf", "application/pdf", "not a PDF".getBytes());
    mvc.perform(multipart("/api/corrections").file(request).file(file).session(login("OWNER")).with(csrf()))
        .andExpect(status().isBadRequest());
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM correction_requests", Integer.class));
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM correction_attachments", Integer.class));
  }

  @Test
  void removedManagementModulesAreNotExposed() throws Exception {
    var session = login("admin");
    for (String path : List.of("/api/departments", "/api/holidays", "/api/leave-requests", "/api/leave-balance")) {
      mvc.perform(get(path).session(session)).andExpect(status().isNotFound());
      mvc.perform(post(path).session(session).with(csrf()).contentType("application/json").content("{}"))
          .andExpect(status().isNotFound());
    }
    employee("PROFILE");
    mvc.perform(get("/api/employees").session(session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].dept").doesNotExist())
        .andExpect(jsonPath("$.items[0].deptId").doesNotExist());
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
    employeeService.update(id, new EmployeeUpdate("Test Employee", "INACTIVE", null, null, null, null, null));
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
  void laterCheckoutCorrectionIsAllowedAndPreservesTheOriginalScan() {
    schedule();
    Long id = employee("RETURNED");
    var date = today.minusDays(1);
    var employee = employees.findById(id).orElseThrow();
    employee.createdAt = date.atStartOfDay(); employees.saveAndFlush(employee);
    attendance.record(id, date.atTime(8, 0), null);
    attendance.record(id, date.atTime(12, 0), null);
    attendance.record(id, date.atTime(13, 0), null);
    attendance.record(id, date.atTime(15, 57), null);
    assertThrows(ApiException.class, () -> attendance.record(id, date.atTime(18, 13), null));
    corrections.create(accounts.findByEmployeeId(id).orElseThrow(),
        new CorrectionRequest(date, "WORK_OUT", LocalTime.of(18, 13), "Returned to work and forgot the final scan"));
    assertEquals(date.atTime(15, 57), attendance.effective(id, date).get("WORK_OUT"));
    Long requestId = jdbc.queryForObject("SELECT id FROM correction_requests", Long.class);
    corrections.review(manager, requestId, new ReviewRequest(true, "Confirmed actual checkout"));
    assertEquals(date.atTime(15, 57), attendance.raw(id, date).get("WORK_OUT"));
    assertEquals(date.atTime(18, 13), attendance.effective(id, date).get("WORK_OUT"));
    assertEquals(553, attendance.day(employee, date).workedMinutes());
    assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM attendance_events WHERE employee_id = ? AND event_type = 'WORK_OUT'", Integer.class, id));
  }

  @Test
  void earlyCheckoutCanBeCorrectedBeforeTheStandardCheckoutTime() {
    schedule();
    Long id = employee("EARLYOUT");
    attendance.record(id, today.atTime(15, 57), null);
    var at1610 = new AttendanceService(employees, attendanceEvents, correctionRecords, shiftService, 0) {
      @Override public LocalDateTime now() { return today.atTime(16, 10); }
    };
    var service = new CorrectionService(correctionRecords, employees, at1610, correctionAttachments, shiftService);
    var account = accounts.findByEmployeeId(id).orElseThrow();
    var options = (Map<?, ?>) service.options(account, today);
    var checkout = (Map<?, ?>) ((List<?>) options.get("milestones")).get(3);
    assertEquals(true, checkout.get("available"));
    assertEquals(LocalTime.of(15, 57), checkout.get("suggestedTime"));
    assertEquals(LocalTime.of(17, 0), checkout.get("targetTime"));

    Long missingId = employee("MISSINGOUT");
    var missingOptions = (Map<?, ?>) service.options(accounts.findByEmployeeId(missingId).orElseThrow(), today);
    var missingCheckout = (Map<?, ?>) ((List<?>) missingOptions.get("milestones")).get(3);
    assertEquals(true, missingCheckout.get("available"));
    assertEquals(LocalTime.of(16, 10), missingCheckout.get("suggestedTime"));
  }

  @Test
  void correctionErrorsDistinguishFutureTimeFromDatesBeforeEmployment() {
    schedule();
    Long id = employee("TIMEERROR");
    var account = accounts.findByEmployeeId(id).orElseThrow();
    var future = attendance.now().plusMinutes(10);
    var futureError = assertThrows(ApiException.class, () -> corrections.create(account,
        new CorrectionRequest(future.toLocalDate(), "WORK_OUT", future.toLocalTime(), "Actual checkout correction")));
    assertTrue(futureError.getMessage().contains("Giờ đề xuất chưa xảy ra"));
    assertTrue(futureError.getMessage().contains("giờ Việt Nam"));
    var oldDateError = assertThrows(ApiException.class, () -> corrections.create(account,
        new CorrectionRequest(today.minusDays(1), "WORK_OUT", LocalTime.of(17, 0), "Actual checkout correction")));
    assertTrue(oldDateError.getMessage().contains("ngày tạo hồ sơ"));
    assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM correction_requests", Integer.class));
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
    String body = "{\"challengeId\":\"test-enrollment-challenge-token\"}";
    mvc.perform(post(path).with(csrf()).contentType("application/json").content(body))
        .andExpect(status().isUnauthorized());
    mvc.perform(
            post(path)
                .session(login("ONE"))
                .with(csrf())
                .contentType("application/json")
                .content(body))
        .andExpect(status().isForbidden());
    mvc.perform(post(path + "/challenge").with(csrf())).andExpect(status().isUnauthorized());
    mvc.perform(post(path + "/challenge").session(login("ONE")).with(csrf()))
        .andExpect(status().isForbidden());
    mvc.perform(post(path).session(login("admin")).with(csrf()).contentType("application/json")
        .content("{\"image\":\"data:image/jpeg;base64,/9j/2Q==\"}"))
        .andExpect(status().isBadRequest());
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
