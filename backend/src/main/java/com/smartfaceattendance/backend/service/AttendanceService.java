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
  private final int grace;

  public AttendanceService(
      EmployeeRepository e,
      AttendanceEventRepository a,
      CorrectionRepository c,
      ShiftService s,
      @Value("${app.grace-minutes:0}") int g) {
    employees = e;
    events = a;
    corrections = c;
    shifts = s;
    grace = g;
    if (g < 0) throw new IllegalArgumentException("Grace cannot be negative");
  }

  public LocalDateTime now() {
    return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
  }

  public boolean policyConfigured() {
    return Boolean.TRUE.equals(policy().get("policyConfigured"));
  }

  public Map<String, Object> policy() {
    var result = new LinkedHashMap<String, Object>();
    result.put("timezone", "Asia/Ho_Chi_Minh");
    Set<DayOfWeek> days = Set.of();
    try {
      var shift = shifts.applicable(now().toLocalDate());
      days = shifts.workingDays(shift.id);
      result.put("shiftId", shift.id);
      result.put("shiftName", shift.shiftName);
    } catch (ApiException e) { if (e.status != 409) throw e; }
    result.put("workingDays", days.stream().map(DayOfWeek::name).toList());
    result.put("policyConfigured", !days.isEmpty());
    result.put("message", days.isEmpty() ? "Chưa chọn ngày làm việc cho lịch hiện tại." : "Đã áp dụng ngày làm việc trong lịch chấm công.");
    return result;
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
    var shift = shifts.applicable(date);
    var workingDays = shifts.workingDays(shift.id);
    if (!workingDays.isEmpty() && !workingDays.contains(date.getDayOfWeek()))
      throw new ApiException(409, "Ngày này là ngày nghỉ theo lịch đã cấu hình.");
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
    var times = effective(employeeId, date);
    if (old.isPresent() || times.containsKey(type))
      throw new ApiException(
          409, "This milestone was already recorded; submit a correction if needed.");
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
    var rawTimes = raw(e.id, date);
    var approved = corrections.findByEmployeeIdAndWorkDateBetween(e.id, date, date).stream()
        .filter(c -> "APPROVED".equals(c.status)).toList();
    Long sid = null;
    try { sid = historicalShift(e.id, date); }
    catch (ApiException ex) { if (ex.status != 409) throw ex; }
    return describe(e, date, rawTimes, approved, sid,
        sid == null ? List.of() : shifts.points(sid),
        sid == null ? Set.of() : shifts.workingDays(sid), now());
  }

  private DayResponse describe(Employee e, LocalDate date,
      Map<String, LocalDateTime> rawTimes, List<Correction> approved, Long sid,
      List<Milestone> points, Set<DayOfWeek> workingDays, LocalDateTime evaluatedAt) {
    var times = new LinkedHashMap<>(rawTimes);
    approved.stream().sorted(Comparator.comparing((Correction c) -> c.reviewedAt,
        Comparator.nullsFirst(Comparator.naturalOrder())).thenComparing(c -> c.id))
        .forEach(c -> times.put(c.eventType, c.proposedOccurredAt));
    boolean configured = !workingDays.isEmpty();
    boolean workingDay = configured && workingDays.contains(date.getDayOfWeek());
    boolean invalidOrder = !AttendanceMath.ordered(times);
    boolean complete = !invalidOrder && times.keySet().containsAll(ShiftService.TYPES);
    boolean missing = points.stream().anyMatch(m -> !times.containsKey(m.eventType)
        && evaluatedAt.isAfter(LocalDateTime.of(date, m.windowEnd)));
    boolean late = !invalidOrder && points.stream().anyMatch(m -> m.eventType.endsWith("IN")
        && times.containsKey(m.eventType)
        && times.get(m.eventType).isAfter(LocalDateTime.of(date, m.targetTime).plusMinutes(grace)));
    boolean early = !invalidOrder && points.stream().anyMatch(m -> m.eventType.endsWith("OUT")
        && times.containsKey(m.eventType)
        && times.get(m.eventType).isBefore(LocalDateTime.of(date, m.targetTime)));
    String status = "Đang diễn ra";
    if (sid == null) status = "Chưa cấu hình lịch";
    else if (invalidOrder) status = "Sai thứ tự giờ";
    else if (configured && !workingDay && times.isEmpty()) status = "Ngày nghỉ";
    else if (missing) status = times.isEmpty()
        ? (!configured ? "Chưa có dữ liệu" : points.stream().allMatch(m ->
            evaluatedAt.isAfter(LocalDateTime.of(date, m.windowEnd))) ? "Vắng mặt" : "Đang diễn ra")
        : "Thiếu mốc chấm công";
    else if (late) status = "Đi muộn";
    else if (early) status = "Về sớm";
    else if (complete) status = "Đúng giờ";
    var shown = display(times);
    return new DayResponse(e.id + "-" + date, e.id, e.employeeCode, e.fullName,
        EmployeeService.initials(e.fullName), date, shown.get("MORNING_IN"), shown.get("WORK_OUT"),
        status, invalidOrder ? 0 : AttendanceMath.workedMinutes(times), complete, shown,
        display(rawTimes), sid, configured, workingDay, !times.isEmpty(), late, early,
        missing && !times.isEmpty(), invalidOrder, !approved.isEmpty());
  }

  private record DayKey(Long employeeId, LocalDate date) {}

  @Transactional(readOnly = true)
  public List<DayResponse> report(Long employeeId, LocalDate from, LocalDate to) {
    if (from.isAfter(to) || java.time.temporal.ChronoUnit.DAYS.between(from, to) > 366)
      throw new ApiException(400, "Choose an ordered range of at most 367 days");
    var staff = employeeId == null ? employees.findAll() : List.of(employees.findById(employeeId)
        .orElseThrow(() -> new ApiException(404, "Employee not found")));
    var evaluatedAt = now();
    var end = to.isBefore(evaluatedAt.toLocalDate()) ? to : evaluatedAt.toLocalDate();
    if (from.isAfter(end)) return List.of();
    // Load each source once, rather than querying events and corrections per employee-day.
    var rawByDay = new HashMap<DayKey, Map<String, LocalDateTime>>();
    var recordedShifts = new HashMap<DayKey, Long>();
    var rawEvents = employeeId == null ? events.findByWorkDateBetween(from, end)
        : events.findByEmployeeIdAndWorkDateBetween(employeeId, from, end);
    rawEvents.stream().sorted(Comparator.comparing(a -> a.id)).forEach(a -> {
      var key = new DayKey(a.employeeId, a.workDate);
      rawByDay.computeIfAbsent(key, k -> new LinkedHashMap<>()).put(a.eventType, a.occurredAt);
      recordedShifts.putIfAbsent(key, a.shiftId);
    });
    var approvedByDay = new HashMap<DayKey, List<Correction>>();
    var approved = employeeId == null ? corrections.findByWorkDateBetweenAndStatus(from, end, "APPROVED")
        : corrections.findByEmployeeIdAndWorkDateBetween(employeeId, from, end);
    approved.stream().filter(c -> "APPROVED".equals(c.status)).sorted(Comparator.comparing(c -> c.id))
        .forEach(c -> approvedByDay.computeIfAbsent(new DayKey(c.employeeId, c.workDate),
            k -> new ArrayList<>()).add(c));
    var versions = shifts.timeline();
    var pointCache = new HashMap<Long, List<Milestone>>();
    var daysCache = new HashMap<Long, Set<DayOfWeek>>();
    var result = new ArrayList<DayResponse>();
    for (LocalDate date = from; !date.isAfter(end); date = date.plusDays(1)) {
      Long applicableId = null;
      for (var version : versions) if (!version.effectiveFrom.isAfter(date)) applicableId = version.id;
      for (var e : staff) {
        if (date.isBefore(e.createdAt.toLocalDate())) continue;
        var key = new DayKey(e.id, date);
        var rawTimes = rawByDay.getOrDefault(key, Map.of());
        var changes = approvedByDay.getOrDefault(key, List.of());
        if (!"ACTIVE".equals(e.status) && rawTimes.isEmpty() && changes.isEmpty()) continue;
        Long sid = recordedShifts.get(key);
        if (sid == null) sid = changes.isEmpty() ? applicableId : changes.get(0).shiftId;
        result.add(describe(e, date, rawTimes, changes, sid,
            sid == null ? List.of() : pointCache.computeIfAbsent(sid, shifts::points),
            sid == null ? Set.of() : daysCache.computeIfAbsent(sid, shifts::workingDays), evaluatedAt));
      }
    }
    result.sort(Comparator.comparing(DayResponse::date).reversed().thenComparing(DayResponse::employeeId));
    return result;
  }
}