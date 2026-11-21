import ExcelJS from 'exceljs';
import {chartSeries, formatDate, percent, reportNotes} from './reports.js';

const titles = ['Mã NV', 'Họ và tên', 'Có mặt', 'Vắng', 'Đi muộn', 'Về sớm', 'Thiếu mốc', 'Đủ 4 mốc', 'Giờ làm', 'Tỷ lệ có mặt', 'Chưa cấu hình', 'Đang chờ chốt', 'Đã chỉnh sửa'];
const staffValues = r => [r.empId, r.name, r.totals.presentDays, r.totals.absentDays, r.totals.lateDays,
  r.totals.earlyDays, r.totals.incompleteDays, r.totals.completeDays, r.totals.workedMinutes / 60,
  r.totals.attendanceRate == null ? null : r.totals.attendanceRate / 100, r.totals.unconfiguredDays,
  r.totals.pendingDays, r.totals.correctedDays];
const yes = value => value ? 'Có' : 'Không';
const types = ['MORNING_IN', 'LUNCH_OUT', 'AFTERNOON_IN', 'WORK_OUT'];

function sheet(workbook, name, headings, rows, widths) {
  const ws = workbook.addWorksheet(name, {views: [{state: 'frozen', ySplit: 1}]});
  ws.columns = headings.map((header, i) => ({header, width: widths?.[i] || 16}));
  rows.forEach(row => ws.addRow(row));
  ws.autoFilter = {from: {row: 1, column: 1}, to: {row: Math.max(1, rows.length + 1), column: headings.length}};
  ws.eachRow((row, index) => {
    row.font = {name: 'Calibri', size: 11, color: {argb: 'FF334155'}};
    row.alignment = {vertical: 'middle', wrapText: true}; row.height = index === 1 ? 32 : 30;
    row.eachCell(cell => {
      cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: index === 1 ? 'FF1E3A8A' : index % 2 ? 'FFF1F5F9' : 'FFFFFFFF'}};
      if (index === 1) cell.font = {name: 'Calibri', size: 11, bold: true, color: {argb: 'FFFFFFFF'}};
    });
  });
  ws.pageSetup = {paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1'};
  ws.headerFooter.oddFooter = '&LFaceAttendance&CTrang &P / &N';
  return ws;
}

export function buildWorkbook(report) {
  const wb = new ExcelJS.Workbook(); wb.creator = 'FaceAttendance';
  const t = report.totals;
  const summary = sheet(wb, 'Tổng quan', ['THỐNG KÊ CHẤM CÔNG', 'Giá trị'], [
    ['Từ ngày', formatDate(report.from)], ['Đến ngày', formatDate(report.to)],
    ['Tạo lúc (GMT+7)', report.generatedAt.replace('T', ' ')],
    ['Phạm vi', report.employeeId == null ? 'Tất cả nhân viên' : report.byEmployee[0]?.empId || ''],
    ['Số nhân viên', report.employeeCount], ['Ngày–nhân viên', t.employeeDays],
    ['Ngày làm việc theo lịch', t.workingDays], ['Ngày có mặt', t.presentDays],
    ['Có mặt theo lịch', t.presentWorkingDays], ['Ngày vắng đã chốt', t.absentDays],
    ['Đi muộn', t.lateDays], ['Về sớm', t.earlyDays], ['Thiếu mốc', t.incompleteDays],
    ['Đủ bốn mốc', t.completeDays], ['Ngày nghỉ theo lịch', t.offDays],
    ['Chưa cấu hình lịch', t.unconfiguredDays], ['Đang chờ chốt', t.pendingDays],
    ['Sai thứ tự giờ', t.invalidDays], ['Đã chỉnh sửa', t.correctedDays],
    ['Tổng giờ làm', t.workedMinutes / 60], ['Tỷ lệ có mặt theo lịch', percent(t.attendanceRate)],
    ...reportNotes.map((note, i) => [`Cách tính ${i + 1}`, note]),
    ['Phạm vi xuất', 'Toàn bộ dữ liệu theo bộ lọc đã áp dụng, không phụ thuộc tìm kiếm hoặc phân trang trên màn hình.'],
  ], [32, 110]);
  summary.getCell('B21').numFmt = '0.00';
  for (let r = 23; r <= summary.rowCount; r++) summary.getRow(r).height = 45;
  const staff = sheet(wb, 'Theo nhân viên', titles, report.byEmployee.map(staffValues), [16, 32]);
  staff.getColumn(9).numFmt = '0.00'; staff.getColumn(10).numFmt = '0.0%';
  const daily = sheet(wb, 'Theo ngày', ['Ngày', ...titles.slice(2)], report.byDate.map(r => [formatDate(r.date), ...staffValues(r).slice(2)]), [16]);
  daily.getColumn(8).numFmt = '0.00'; daily.getColumn(9).numFmt = '0.0%';
  const detail = sheet(wb, 'Chi tiết chấm công', ['Mã NV', 'Họ và tên', 'Ngày', 'Vào sáng', 'Ra trưa', 'Vào chiều', 'Ra chiều', 'Giờ làm', 'Trạng thái', 'Ngày làm theo lịch', 'Đi muộn', 'Về sớm', 'Thiếu mốc', 'Đã chỉnh sửa', 'Mã lịch', 'Đã cấu hình lịch', 'Gốc: vào sáng', 'Gốc: ra trưa', 'Gốc: vào chiều', 'Gốc: ra chiều'], report.details.map(r => [
    r.empId, r.name, formatDate(r.date), ...types.map(type => r.milestones[type]), r.workedMinutes / 60,
    r.status, yes(r.workingDay), yes(r.late), yes(r.early), yes(r.missingMilestones), yes(r.corrected),
    r.shiftId, yes(r.workingDaysConfigured), ...types.map(type => r.rawMilestones[type]),
  ]), [16, 32, 16, 14, 14, 14, 14, 14, 26]);
  detail.getColumn(8).numFmt = '0.00';
  return wb;
}

let fontPromise;
async function loadFont() {
  fontPromise ||= fetch(`${import.meta.env?.BASE_URL || '/'}fonts/NotoSans-Regular.ttf`).then(async res => {
    if (!res.ok) throw new Error('Không tải được font tiếng Việt. Vui lòng thử lại.');
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }).catch(error => {fontPromise = undefined; throw error;});
  return fontPromise;
}

export async function buildPdf(report, fontBase64) {
  const [{jsPDF}, {autoTable}] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4', compress: true});
  doc.addFileToVFS('NotoSans.ttf', fontBase64 || await loadFont());
  doc.addFont('NotoSans.ttf', 'NotoSans', 'normal'); doc.setFont('NotoSans');
  doc.setProperties({title: `Báo cáo chấm công ${report.from} - ${report.to}`, author: 'FaceAttendance'});
  const heading = title => {
    doc.setTextColor('#0f172a'); doc.setFontSize(17); doc.text(title, 14, 19);
    doc.setTextColor('#64748b'); doc.setFontSize(9);
    doc.text(`${formatDate(report.from)} - ${formatDate(report.to)}  |  ${report.employeeCount} nhân viên  |  GMT+7`, 14, 27);
  };
  const tableOptions = {theme: 'striped', margin: {top: 34, right: 14, bottom: 16, left: 14},
    styles: {font: 'NotoSans', fontStyle: 'normal', fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak'},
    headStyles: {fontStyle: 'normal', fillColor: '#1e3a8a', textColor: '#ffffff'},
    alternateRowStyles: {fillColor: '#f1f5f9'},
  };
  heading('BÁO CÁO CHẤM CÔNG');
  doc.setFontSize(8);
  const scope = report.employeeId == null ? 'Tất cả nhân viên' : `${report.byEmployee[0]?.empId || ''} - ${report.byEmployee[0]?.name || ''}`;
  doc.text(doc.splitTextToSize(`Phạm vi: ${scope} | Tạo lúc: ${report.generatedAt.replace('T', ' ').slice(0, 19)}`, 269).slice(0, 2), 14, 34);
  const t = report.totals;
  [['Ngày có mặt', String(t.presentDays)], ['Ngày vắng đã chốt', String(t.absentDays)], ['Ngày đi muộn', String(t.lateDays)], ['Tổng giờ làm', (t.workedMinutes / 60).toFixed(1)]].forEach(([label, value], i) => {
    const x = 14 + i * 68;
    doc.setFillColor('#eff6ff'); doc.roundedRect(x, 42, 64, 23, 2, 2, 'F');
    doc.setTextColor('#64748b'); doc.setFontSize(8); doc.text(label, x + 4, 49);
    doc.setTextColor('#1e3a8a'); doc.setFontSize(16); doc.text(value, x + 4, 60);
  });
  doc.setTextColor('#334155'); doc.setFontSize(8);
  doc.text(`Tỷ lệ có mặt: ${percent(t.attendanceRate)}   |   Đủ 4 mốc: ${t.completeDays}   |   Thiếu mốc: ${t.incompleteDays}   |   Về sớm: ${t.earlyDays}   |   Chờ chốt: ${t.pendingDays}`, 14, 74);
  doc.text(`Chưa cấu hình: ${t.unconfiguredDays}   |   Ngày nghỉ: ${t.offDays}   |   Sai thứ tự: ${t.invalidDays}   |   Đã chỉnh sửa: ${t.correctedDays}`, 14, 80);
  const chart = chartSeries(report.byDate), buckets = [], chunk = Math.max(1, Math.ceil(chart.items.length / 12));
  for (let i = 0; i < chart.items.length; i += chunk) {
    const part = chart.items.slice(i, i + chunk);
    buckets.push({label: part[0].label, ...Object.fromEntries(['presentDays', 'absentDays', 'lateDays'].map(k => [k, part.reduce((s, g) => s + g[k], 0)]))});
  }
  doc.setFontSize(9); doc.text('Xu hướng có mặt / vắng / đi muộn (ngày–nhân viên)', 14, 91);
  const max = Math.max(1, ...buckets.flatMap(b => [b.presentDays, b.absentDays, b.lateDays]));
  const step = 260 / Math.max(1, buckets.length);
  doc.setDrawColor('#cbd5e1'); doc.line(22, 137, 281, 137);
  doc.setFontSize(6.5); doc.text(String(max), 14, 100); doc.text('0', 17, 138);
  buckets.forEach((b, i) => {
    [['presentDays', '#059669'], ['absentDays', '#ef4444'], ['lateDays', '#f59e0b']].forEach(([key, color], j) => {
      const h = b[key] / max * 36;
      if (h) {doc.setFillColor(color); doc.rect(24 + i * step + j * 3.5, 137 - h, 3, h, 'F');}
    });
    doc.setTextColor('#64748b'); doc.text(b.label, 24 + i * step, 143);
  });
  doc.setFontSize(7); doc.setTextColor('#334155');
  [['Có mặt', '#059669'], ['Vắng', '#ef4444'], ['Đi muộn (thuộc có mặt)', '#f59e0b']].forEach(([label, color], i) => {
    doc.setFillColor(color); doc.rect(14 + i * 65, 149, 2, 2, 'F'); doc.text(label, 18 + i * 65, 151);
  });
  doc.setFontSize(6); doc.setTextColor('#64748b');
  doc.text(`Mỗi nhóm cột: ${chunk} ${chart.mode === 'month' ? 'tháng' : chart.mode === 'week' ? 'tuần' : 'ngày'}; nhãn là ngày đầu nhóm. Nhóm cuối có thể ngắn hơn.`, 14, 155);
  doc.setFontSize(6.8); doc.setTextColor('#64748b');
  doc.text(doc.splitTextToSize(reportNotes.join('\n'), 269), 14, 160, {lineHeightFactor: 1.35});
  doc.addPage(); heading('TỔNG HỢP THEO NHÂN VIÊN');
  autoTable(doc, {...tableOptions, startY: 34, head: [titles.slice(0, 10)],
    body: report.byEmployee.length ? report.byEmployee.map(r => staffValues(r).slice(0, 10).map((v, i) => i === 8 ? v.toFixed(2) : i === 9 ? percent(r.totals.attendanceRate) : v)) : [['Không có dữ liệu', ...Array(9).fill('')]],
    columnStyles: {0: {cellWidth: 24}, 1: {cellWidth: 44}},
  });
  doc.addPage(); heading('CHI TIẾT CHẤM CÔNG');
  autoTable(doc, {...tableOptions, startY: 34,
    head: [['Mã NV', 'Họ và tên', 'Ngày', 'Vào sáng', 'Ra trưa', 'Vào chiều', 'Ra chiều', 'Giờ làm', 'Trạng thái', 'Chỉnh sửa']],
    body: report.details.length ? report.details.map(r => [r.empId, r.name, formatDate(r.date), ...types.map(k => r.milestones[k]), (r.workedMinutes / 60).toFixed(2), r.status, yes(r.corrected)]) : [['Không có dữ liệu', ...Array(9).fill('')]],
    columnStyles: {0: {cellWidth: 23}, 1: {cellWidth: 36}, 2: {cellWidth: 24}, 8: {cellWidth: 37}},
  });
  const count = doc.getNumberOfPages();
  for (let p = 1; p <= count; p++) {
    doc.setPage(p); doc.setFontSize(7); doc.setTextColor('#94a3b8');
    doc.text('FaceAttendance | Dữ liệu sau chỉnh sửa đã duyệt | GMT+7', 14, 202);
    doc.text(`Trang ${p}/${count}`, 283, 202, {align: 'right'});
  }
  return doc;
}

export async function downloadReport(type, report) {
  const filename = `Bao-cao-cham-cong_${report.from}_${report.to}${report.employeeId ? `_NV${report.employeeId}` : ''}`;
  if (type === 'pdf') (await buildPdf(report)).save(`${filename}.pdf`);
  else {
    const {saveAs} = await import('file-saver');
    const buffer = await buildWorkbook(report).xlsx.writeBuffer();
    saveAs(new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), `${filename}.xlsx`);
  }
}
