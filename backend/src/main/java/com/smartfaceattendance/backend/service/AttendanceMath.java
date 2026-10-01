package com.smartfaceattendance.backend.service;

import java.time.*;
import java.util.*;

/** Pure calculations shared by corrections, reports and tests. Missing pairs contribute no time. */
public final class AttendanceMath {
  private AttendanceMath() {}

  public static long workedMinutes(Map<String, LocalDateTime> times) {
    return pair(times, "MORNING_IN", "LUNCH_OUT") + pair(times, "AFTERNOON_IN", "WORK_OUT");
  }

  private static long pair(Map<String, LocalDateTime> t, String a, String b) {
    if (t.get(a) == null || t.get(b) == null || t.get(b).isBefore(t.get(a))) return 0;
    return Duration.between(t.get(a), t.get(b)).toMinutes();
  }

  public static boolean ordered(Map<String, LocalDateTime> times) {
    LocalDateTime previous = null;
    for (String type : ShiftService.TYPES) {
      var t = times.get(type);
      if (t != null) {
        if (previous != null && t.isBefore(previous)) return false;
        previous = t;
      }
    }
    return true;
  }
}
