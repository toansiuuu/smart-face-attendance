package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.dto.request.HolidayRequest;
import com.smartfaceattendance.backend.entity.Holiday;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.HolidayRepository;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class HolidayService {
  private final HolidayRepository holidays;

  public HolidayService(HolidayRepository h) {
    holidays = h;
  }

  public boolean isHoliday(LocalDate date) {
    if (holidays.existsByHolidayDate(date)) return true;
    return holidays.findRecurring().stream()
        .anyMatch(h -> h.holidayDate.getMonthValue() == date.getMonthValue()
            && h.holidayDate.getDayOfMonth() == date.getDayOfMonth());
  }

  public List<Map<String, Object>> list(int year) {
    var from = LocalDate.of(year, 1, 1);
    var to = LocalDate.of(year, 12, 31);
    var exact = holidays.findByHolidayDateBetween(from, to);
    var recurring = holidays.findRecurring();
    var result = new ArrayList<Map<String, Object>>();
    var seen = new HashSet<Long>();
    for (var h : exact) {
      seen.add(h.id);
      result.add(toMap(h, h.holidayDate));
    }
    for (var h : recurring) {
      if (seen.contains(h.id)) continue;
      var resolved = LocalDate.of(year, h.holidayDate.getMonthValue(), h.holidayDate.getDayOfMonth());
      result.add(toMap(h, resolved));
    }
    result.sort(Comparator.comparing(m -> (String) m.get("date")));
    return result;
  }

  private Map<String, Object> toMap(Holiday h, LocalDate resolved) {
    return Map.of("id", h.id, "date", resolved.toString(), "name", h.name,
        "isRecurring", h.isRecurring, "createdAt", h.createdAt.toString());
  }

  public Holiday create(HolidayRequest r) {
    if (holidays.existsByHolidayDate(r.date()))
      throw new ApiException(409, "A holiday already exists on this date");
    var h = new Holiday();
    h.holidayDate = r.date();
    h.name = r.name().trim();
    h.isRecurring = r.isRecurring();
    h.createdAt = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    return holidays.saveAndFlush(h);
  }

  public Holiday update(Long id, HolidayRequest r) {
    var h = holidays.findById(id).orElseThrow(() -> new ApiException(404, "Holiday not found"));
    if (!h.holidayDate.equals(r.date()) && holidays.existsByHolidayDate(r.date()))
      throw new ApiException(409, "A holiday already exists on this date");
    h.holidayDate = r.date();
    h.name = r.name().trim();
    h.isRecurring = r.isRecurring();
    return holidays.saveAndFlush(h);
  }

  public void delete(Long id) {
    if (!holidays.existsById(id)) throw new ApiException(404, "Holiday not found");
    holidays.deleteById(id);
  }
}
