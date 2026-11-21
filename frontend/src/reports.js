// Dates here are ISO work dates in Asia/Ho_Chi_Minh, never browser-local timestamps.
const dayMs = 86400000;
const stamp = value => Date.parse(`${value}T00:00:00Z`);
const iso = value => value.toISOString().slice(0, 10);
export const formatDate = value => value ? value.split('-').reverse().join('/') : '-';
export const hours = minutes => new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 1}).format(minutes / 60);
export const percent = value => value == null ? 'Chưa đủ dữ liệu' : `${new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 1}).format(value)}%`;

export function rangeError(from, to, today) {
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(stamp(value)) && iso(new Date(stamp(value))) === value;
  if (!valid(from) || !valid(to)) return 'Vui lòng nhập đầy đủ ngày hợp lệ.';
  if (from > to) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  if (to > today) return 'Báo cáo chỉ tính đến ngày hôm nay.';
  if ((stamp(to) - stamp(from)) / dayMs > 366) return 'Mỗi báo cáo tối đa 367 ngày.';
  return '';
}

export function reportRange(preset, today) {
  const end = new Date(stamp(today));
  const start = new Date(end);
  if (preset === 'previous') {
    start.setUTCDate(1); start.setUTCMonth(start.getUTCMonth() - 1);
    end.setUTCDate(0);
  } else if (preset === '7' || preset === '30') start.setUTCDate(start.getUTCDate() - Number(preset) + 1);
  else start.setUTCDate(1);
  return {from: iso(start), to: iso(end), employeeId: ''};
}

export function employeeRows(rows, search, sort) {
  const q = search.trim().toLocaleLowerCase('vi');
  return rows.filter(r => `${r.empId} ${r.name}`.toLocaleLowerCase('vi').includes(q))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'vi') || a.empId.localeCompare(b.empId);
      return b.totals[sort] - a.totals[sort] || a.empId.localeCompare(b.empId);
    });
}

export function chartSeries(byDate) {
  const mode = byDate.length > 120 ? 'month' : byDate.length > 45 ? 'week' : 'day';
  const groups = new Map();
  for (const day of byDate) {
    const date = new Date(stamp(day.date));
    if (mode === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    const key = mode === 'month' ? day.date.slice(0, 7) : mode === 'week' ? iso(date) : day.date;
    if (!groups.has(key)) groups.set(key, {key, from: day.date, to: day.date, presentDays: 0, absentDays: 0, lateDays: 0});
    const group = groups.get(key);
    group.to = day.date;
    for (const field of ['presentDays', 'absentDays', 'lateDays']) group[field] += day.totals[field];
  }
  return {mode, items: [...groups.values()].map(g => ({...g,
    label: mode === 'month' ? g.key.split('-').reverse().join('/') : g.from.slice(5).split('-').reverse().join('/')}))};
}

export const reportNotes = [
  'Ngày có mặt: có ít nhất một mốc chấm công hiệu lực, kể cả ngày nghỉ.',
  'Vắng: ngày làm việc không có mốc nào, chỉ chốt sau khi tất cả cửa sổ quét đã kết thúc.',
  'Tỷ lệ có mặt = ngày có mặt theo lịch / (ngày có mặt theo lịch + ngày vắng). Loại ngày nghỉ, ngày chưa cấu hình và ngày đang chờ chốt.',
  'Đi muộn và về sớm tính theo lịch từng ngày, chỉ trên ngày làm việc. Một ngày có thể đồng thời muộn, sớm và thiếu mốc; không cộng các chỉ số này thành tổng ngày.',
  'Giờ làm là tổng hai cặp vào/ra hợp lệ; thiếu một đầu thì cặp đó chưa được tính. Không tự suy ra tăng ca hoặc tiền lương.',
  'Dùng giờ sau chỉnh sửa đã duyệt. Bỏ qua ngày trước khi tạo nhân viên; tài khoản ngừng hoạt động chỉ hiện ngày có dữ liệu.'
];
