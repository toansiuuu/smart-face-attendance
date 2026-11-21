// Synthetic data only, used to verify Vietnamese fonts, long names and page breaks.
export function sampleReport(employeeCount = 2, dayCount = 3) {
  const zero = () => ({employeeDays: 0, workingDays: 0, presentDays: 0, presentWorkingDays: 0,
    absentDays: 0, lateDays: 0, earlyDays: 0, incompleteDays: 0, completeDays: 0, offDays: 0,
    unconfiguredDays: 0, pendingDays: 0, invalidDays: 0, correctedDays: 0, workedMinutes: 0, attendanceRate: null});
  const staff = Array.from({length: employeeCount}, (_, i) => ({employeeId: i + 1, empId: `NV${String(i + 1).padStart(3, '0')}`,
    name: i % 2 ? 'Trần Thị Ánh Nguyệt' : 'Nguyễn Hoàng Đức Thành', status: 'ACTIVE', totals: zero()}));
  const totals = zero(), byDate = [], details = [];
  for (let d = 0; d < dayCount; d++) {
    const date = new Date(Date.UTC(2026, 10, d + 1)).toISOString().slice(0, 10), daily = zero();
    for (const [i, employee] of staff.entries()) {
      const absent = (i + d) % 4 === 0, late = !absent && (i + d) % 3 === 0;
      const values = {employeeDays: 1, workingDays: 1, presentDays: absent ? 0 : 1, presentWorkingDays: absent ? 0 : 1,
        absentDays: absent ? 1 : 0, lateDays: late ? 1 : 0, completeDays: absent ? 0 : 1, workedMinutes: absent ? 0 : late ? 450 : 480};
      for (const target of [totals, daily, employee.totals]) for (const [key, value] of Object.entries(values)) target[key] += value;
      const milestones = {MORNING_IN: absent ? '—' : late ? '08:30' : '08:00', LUNCH_OUT: absent ? '—' : '12:00', AFTERNOON_IN: absent ? '—' : '13:00', WORK_OUT: absent ? '—' : '17:00'};
      details.push({id: `${employee.employeeId}-${date}`, employeeId: employee.employeeId, empId: employee.empId, name: employee.name,
        date, status: absent ? 'Vắng mặt' : late ? 'Đi muộn' : 'Đúng giờ', workedMinutes: values.workedMinutes,
        complete: !absent, workingDaysConfigured: true, workingDay: true, present: !absent, late, early: false,
        missingMilestones: false, corrected: false, invalidOrder: false, shiftId: 1, milestones, rawMilestones: {...milestones}});
    }
    byDate.push({date, totals: daily});
  }
  for (const target of [totals, ...byDate.map(d => d.totals), ...staff.map(e => e.totals)]) {
    const denominator = target.presentWorkingDays + target.absentDays;
    target.attendanceRate = denominator ? Math.round(target.presentWorkingDays / denominator * 1000) / 10 : null;
  }
  return {from: '2026-11-01', to: byDate.at(-1)?.date || '2026-11-01', generatedAt: '2026-11-21T18:30:00',
    timezone: 'Asia/Ho_Chi_Minh', employeeId: null, employeeCount, totals, byDate, byEmployee: staff, details};
}
