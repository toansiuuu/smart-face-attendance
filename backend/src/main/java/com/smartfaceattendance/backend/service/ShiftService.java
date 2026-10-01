package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.*;
import com.smartfaceattendance.backend.entity.*;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShiftService {
  public static final List<String> TYPES =
      List.of("MORNING_IN", "LUNCH_OUT", "AFTERNOON_IN", "WORK_OUT");
  private final ShiftRepository shifts;
  private final MilestoneRepository milestones;

  public ShiftService(ShiftRepository s, MilestoneRepository m) {
    shifts = s;
    milestones = m;
  }

  public Shift applicable(LocalDate date) {
    return shifts
        .findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(date)
        .orElseThrow(() -> new ApiException(409, "No fixed schedule configured for " + date));
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

  @Transactional
  public Object create(ShiftRequest r) {
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
