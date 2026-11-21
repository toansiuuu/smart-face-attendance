package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShiftService {
  public static final List<String> TYPES =
      List.of("MORNING_IN", "LUNCH_OUT", "AFTERNOON_IN", "WORK_OUT");
  private final ShiftRepository shifts;
  private final MilestoneRepository milestones;
  private final JdbcTemplate jdbc;
  private final Set<DayOfWeek> legacyDays;

  public ShiftService(ShiftRepository s, MilestoneRepository m, JdbcTemplate jdbc, @Value("${app.working-days:}") String legacyDays) {
    shifts = s;
    milestones = m;
    this.jdbc = jdbc;
    this.legacyDays = EnumSet.noneOf(DayOfWeek.class);
    for (String day : legacyDays.split(",")) if (!day.isBlank()) this.legacyDays.add(DayOfWeek.valueOf(day.trim().toUpperCase(Locale.ROOT)));
  }

  public Shift applicable(LocalDate date) {
    return shifts
        .findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(date)
        .orElseThrow(() -> new ApiException(409, "No fixed schedule configured for " + date));
  }

  public String name(Long id) {
    return shifts.findById(id).orElseThrow(() -> new ApiException(404, "Không tìm thấy lịch.")).shiftName;
  }

  public List<Milestone> points(Long id) {
    return milestones.findByShiftId(id).stream()
        .sorted(Comparator.comparingInt(m -> TYPES.indexOf(m.eventType)))
        .toList();
  }

  public Object view(Shift s) {
    return Map.of(
        "id",
        s.id,
        "shiftCode",
        s.shiftCode,
        "shiftName",
        s.shiftName,
        "effectiveFrom",
        s.effectiveFrom,
        "workingDays", workingDays(s.id).stream().map(DayOfWeek::name).toList(),
        "workingDaysSaved", daysSaved(s.id),
        "workingDaysConfigured", !workingDays(s.id).isEmpty(),
        "milestones",
        points(s.id).stream()
            .map(
                m ->
                    Map.of(
                        "eventType",
                        m.eventType,
                        "targetTime",
                        m.targetTime,
                        "windowStart",
                        m.windowStart,
                        "windowEnd",
                        m.windowEnd))
            .toList());
  }

  public List<Object> list() {
    return shifts.findAll().stream()
        .sorted(Comparator.comparing(s -> s.effectiveFrom))
        .map(this::view)
        .toList();
  }

  public boolean daysSaved(Long shiftId) {
    return jdbc.queryForObject("SELECT COUNT(*) FROM shift_working_day_policy WHERE shift_id = ?", Integer.class, shiftId) > 0;
  }

  public Set<DayOfWeek> workingDays(Long shiftId) {
    var stored = jdbc.query("SELECT working_days FROM shift_working_day_policy WHERE shift_id = ?", (rs, row) -> rs.getString(1), shiftId);
    if (stored.isEmpty()) return EnumSet.copyOf(legacyDays);
    var result = EnumSet.noneOf(DayOfWeek.class);
    for (String day : stored.get(0).split(",")) result.add(DayOfWeek.valueOf(day));
    return result;
  }

  private Set<DayOfWeek> validateDays(List<DayOfWeek> days) {
    if (days == null || days.isEmpty() || days.size() > 7 || days.stream().anyMatch(Objects::isNull))
      throw new ApiException(400, "Chọn từ 1 đến 7 ngày làm việc hợp lệ.");
    var result = EnumSet.copyOf(days);
    if (result.size() != days.size()) throw new ApiException(400, "Ngày làm việc không được lặp lại.");
    return result;
  }

  private void saveDays(Long shiftId, Set<DayOfWeek> days) {
    jdbc.update("INSERT INTO shift_working_day_policy (shift_id, working_days) VALUES (?, ?)", shiftId,
        days.stream().map(DayOfWeek::name).collect(java.util.stream.Collectors.joining(",")));
  }

  @Transactional
  public Object configureDays(Long shiftId, WorkingDaysRequest request) {
    var days = validateDays(request.workingDays());
    var found = jdbc.queryForList("SELECT id FROM shifts WHERE id = ? FOR UPDATE", Long.class, shiftId);
    if (found.isEmpty()) throw new ApiException(404, "Không tìm thấy lịch.");
    if (daysSaved(shiftId)) throw new ApiException(409, "Lịch đã có ngày làm việc. Hãy tạo phiên bản lịch mới để giữ đúng lịch sử.");
    saveDays(shiftId, days);
    return view(shifts.findById(shiftId).orElseThrow());
  }

  @Transactional
  public Object create(ShiftRequest r) {
    var days = validateDays(r.workingDays());
    if (shifts.count() > 0
        && !r.effectiveFrom().isAfter(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))))
      throw new ApiException(
          400, "New schedule versions must start in the future to preserve history.");
    var sorted =
        r.milestones().stream()
            .sorted(Comparator.comparingInt(m -> TYPES.indexOf(m.eventType())))
            .toList();
    if (!new HashSet<>(sorted.stream().map(MilestoneRequest::eventType).toList())
        .equals(new HashSet<>(TYPES)))
      throw new ApiException(400, "Supply exactly the four supported milestones");
    LocalTime previous = null;
    for (var m : sorted) {
      if (m.windowStart().isAfter(m.targetTime()) || m.targetTime().isAfter(m.windowEnd()))
        throw new ApiException(400, "Each target must be inside its scan window");
      if (previous != null && !m.windowStart().isAfter(previous))
        throw new ApiException(400, "Milestone windows must be ordered and must not overlap");
      previous = m.windowEnd();
    }
    var s = new Shift();
    s.shiftCode = r.shiftCode().trim();
    s.shiftName = r.shiftName().trim();
    s.effectiveFrom = r.effectiveFrom();
    shifts.saveAndFlush(s);
    saveDays(s.id, days);
    for (var m : sorted) {
      var p = new Milestone();
      p.shiftId = s.id;
      p.eventType = m.eventType();
      p.targetTime = m.targetTime();
      p.windowStart = m.windowStart();
      p.windowEnd = m.windowEnd();
      milestones.save(p);
    }
    return view(s);
  }
}
