package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.response.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceService {
  private final EmployeeRepository employees;
  private final AttendanceEventRepository events;
  private final CorrectionRepository corrections;
  private final ShiftService shifts;
  private final HolidayService holidayService;
  private final LeaveService leaveService;
  private final Set<DayOfWeek> workingDays;
  private final int grace;

  public AttendanceService(
      EmployeeRepository e,
      AttendanceEventRepository a,
      CorrectionRepository c,
      ShiftService s,
      HolidayService h,
      LeaveService l,
      @Value("${app.working-days:}") String days,
      @Value("${app.grace-minutes:0}") int g) {
    employees = e;
    events = a;
    corrections = c;
    shifts = s;
    holidayService = h;
    leaveService = l;
    grace = g;
    if (g < 0) throw new IllegalArgumentException("Grace cannot be negative");
    workingDays = new HashSet<>();
    for (String d : days.split(","))
      if (!d.isBlank()) workingDays.add(DayOfWeek.valueOf(d.trim().toUpperCase()));
  }

  public LocalDateTime now() {
    return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
  }

  public boolean policyConfigured() {
    return !workingDays.isEmpty();
  }

  public Map<String, LocalDateTime> raw(Long id, LocalDate d) {
    var map = new LinkedHashMap<String, LocalDateTime>();
    events
        .findByEmployeeIdAndWorkDateBetween(id, d, d)
        .forEach(e -> map.put(e.eventType, e.occurredAt));
    return map;
  }

  public Map<String, LocalDateTime> effective(Long id, LocalDate d) {
    var map = raw(id, d);
    corrections.findByEmployeeIdAndWorkDateBetween(id, d, d).stream()
        .filter(c -> "APPROVED".equals(c.status))
        .sorted(
            Comparator.comparing(
                    (Correction c) -> c.reviewedAt,
                    Comparator.nullsFirst(Comparator.naturalOrder()))
                .thenComparing(c -> c.id))
        .forEach(c -> map.put(c.eventType, c.proposedOccurredAt));
    return map;
  }

  public Long historicalShift(Long id, LocalDate d) {
    var es = events.findByEmployeeIdAndWorkDateBetween(id, d, d);
    if (!es.isEmpty()) return es.get(0).shiftId;
    return corrections.findByEmployeeIdAndWorkDateBetween(id, d, d).stream()
        .filter(c -> "APPROVED".equals(c.status))
        .findFirst()
        .map(c -> c.shiftId)
        .orElseGet(() -> shifts.applicable(d).id);
  }

  @Transactional
  public AttendanceEvent record(Long employeeId, LocalDateTime at, String explicitType) {
    var e =
        employees
            .lockById(employeeId)
            .orElseThrow(() -> new ApiException(404, "Employee not found"));
    if (!"ACTIVE".equals(e.status)) throw new ApiException(403, "Employee inactive");
    var date = at.toLocalDate();
    if (policyConfigured() && !workingDays.contains(date.getDayOfWeek()))
      throw new ApiException(409, "This is not a configured working day");
    var shift = shifts.applicable(date);
    var points = shifts.points(shift.id);
    var matches =
        points.stream()
            .filter(
                m ->
                    !at.toLocalTime().isBefore(m.windowStart)
                        && !at.toLocalTime().isAfter(m.windowEnd))
            .toList();
    String type;
    if (explicitType != null) {
      if (!ShiftService.TYPES.contains(explicitType))
        throw new ApiException(400, "Unknown milestone");
      type = explicitType;
    } else {
      if (matches.size() != 1)
        throw new ApiException(409, "No unique scan window matches this time");
      type = matches.get(0).eventType;
    }
    var old = events.findByEmployeeIdAndWorkDateAndEventType(employeeId, date, type);
    if (old.isPresent())
      throw new ApiException(
          409, "This milestone was already recorded; submit a correction if needed.");
    var times = effective(employeeId, date);
    times.put(type, at);
    if (!AttendanceMath.ordered(times))
      throw new ApiException(409, "Event would reverse milestone order");
    var event = new AttendanceEvent();
    event.employeeId = e.id;
    event.shiftId = shift.id;
    event.workDate = date;
    event.eventType = type;
    event.occurredAt = at;
    event.createdAt = now();
    return events.saveAndFlush(event);
  }

  private Map<String, String> display(Map<String, LocalDateTime> input) {
    var out = new LinkedHashMap<String, String>();
    for (String t : ShiftService.TYPES)
      out.put(
          t,
          input.containsKey(t) ? input.get(t).format(DateTimeFormatter.ofPattern("HH:mm")) : "—");
    return out;
  }

  public DayResponse day(Employee e, LocalDate date) {
    var times = effective(e.id, date);
    Long sid = null;
    List<Milestone> points = List.of();
    try {
      sid = historicalShift(e.id, date);
      points = shifts.points(sid);
    } catch (ApiException ex) {
      if (ex.status != 409) throw ex;
    }
    String status = "Đang diễn ra";
    boolean complete = times.size() == 4;
    var now = now();
    if (holidayService.isHoliday(date) && times.isEmpty()) status = "Ngày lễ";
    else if (leaveService.isOnLeave(e.id, date) && times.isEmpty()) status = "Nghỉ phép";
    else if (sid == null) status = "Chưa cấu hình lịch";
    else if (!AttendanceMath.ordered(times)) status = "Sai thứ tự giờ";
    else if (policyConfigured() && !workingDays.contains(date.getDayOfWeek()) && times.isEmpty())
      status = "Ngày nghỉ";
    else {
      boolean missing =
          points.stream()
              .anyMatch(
                  m ->
                      !times.containsKey(m.eventType)
                          && now.isAfter(LocalDateTime.of(date, m.windowEnd)));
      boolean late =
          points.stream()
              .anyMatch(
                  m ->
                      m.eventType.endsWith("IN")
                          && times.containsKey(m.eventType)
                          && times
                              .get(m.eventType)
                              .isAfter(LocalDateTime.of(date, m.targetTime).plusMinutes(grace)));
      boolean early =
          points.stream()
              .anyMatch(
                  m ->
                      m.eventType.endsWith("OUT")
                          && times.containsKey(m.eventType)
                          && times.get(m.eventType).isBefore(LocalDateTime.of(date, m.targetTime)));
      if (missing)
        status =
            times.isEmpty()
                ? (policyConfigured() ? "Vắng mặt" : "Chưa có dữ liệu")
                : "Thiếu mốc chấm công";
      else if (late) status = "Đi muộn";
      else if (early) status = "Về sớm";
      else if (complete) status = "Đúng giờ";
    }
    var shown = display(times);
    return new DayResponse(
        e.id + "-" + date,
        e.id,
        e.employeeCode,
        e.fullName,
        EmployeeService.initials(e.fullName),
        null,
        date,
        shown.get("MORNING_IN"),
        shown.get("WORK_OUT"),
        status,
        AttendanceMath.workedMinutes(times),
        complete,
        shown,
        display(raw(e.id, date)),
        sid);
  }

  public List<DayResponse> report(Long employeeId, LocalDate from, LocalDate to) {
    if (from.isAfter(to) || java.time.temporal.ChronoUnit.DAYS.between(from, to) > 366)
      throw new ApiException(400, "Choose an ordered range of at most 367 days");
    var staff =
        employeeId == null
            ? employees.findAll()
            : List.of(
                employees
                    .findById(employeeId)
                    .orElseThrow(() -> new ApiException(404, "Employee not found")));
    var result = new ArrayList<DayResponse>();
    var today = now().toLocalDate();
    for (LocalDate date = from;
        !date.isAfter(to) && !date.isAfter(today);
        date = date.plusDays(1)) {
      for (var e : staff) {
        if (date.isBefore(e.createdAt.toLocalDate())) continue;
        if (!"ACTIVE".equals(e.status)
            && raw(e.id, date).isEmpty()
            && effective(e.id, date).isEmpty()) continue;
        result.add(day(e, date));
      }
    }
    result.sort(
        Comparator.comparing(DayResponse::date).reversed().thenComparing(DayResponse::employeeId));
    return result;
  }
}
