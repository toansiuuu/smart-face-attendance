import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ExcelJS from 'exceljs';
import {chartSeries, employeeRows, percent, rangeError, reportRange} from './src/reports.js';
import {buildPdf, buildWorkbook} from './src/report-export.js';
import {sampleReport} from './test-data/report.js';

test('report ranges respect leap years, month boundaries, UTC work dates and 367-day limit', () => {
  assert.deepEqual(reportRange('previous', '2024-03-01'), {from: '2024-02-01', to: '2024-02-29', employeeId: ''});
  assert.equal(reportRange('7', '2026-01-02').from, '2025-12-27');
  assert.ok(rangeError('2026-02-30', '2026-03-01', '2026-11-21'));
  assert.ok(rangeError('', '2026-11-21', '2026-11-21'));
  assert.ok(rangeError('2026-11-21', '2026-11-22', '2026-11-21'));
  assert.ok(rangeError('2026-11-20', '2026-11-19', '2026-11-21'));
  assert.equal(rangeError('2025-11-20', '2026-11-21', '2026-11-21'), '');
  assert.ok(rangeError('2025-11-19', '2026-11-21', '2026-11-21'));
  assert.equal(percent(null), 'Chưa đủ dữ liệu');
});

test('chart aggregation preserves totals and employee sorting never mutates source', () => {
  const report = sampleReport(3, 160), original = report.byEmployee.map(e => e.employeeId);
  const chart = chartSeries(report.byDate);
  assert.equal(chart.mode, 'month');
  assert.equal(chart.items.reduce((sum, x) => sum + x.presentDays, 0), report.totals.presentDays);
  assert.equal(chart.items.reduce((sum, x) => sum + x.absentDays, 0), report.totals.absentDays);
  assert.equal(chartSeries(report.byDate.slice(0, 60)).mode, 'week');
  assert.equal(employeeRows(report.byEmployee, '  nv002 ', 'name').length, 1);
  employeeRows(report.byEmployee, '', 'lateDays');
  assert.deepEqual(report.byEmployee.map(e => e.employeeId), original);
});

test('Excel roundtrip preserves all rows, numeric hours, ratios, Vietnamese and original scan times', async () => {
  const report = sampleReport(13, 4);
  report.details[1].corrected = true;
  report.details[1].rawMilestones.MORNING_IN = '08:59';
  report.byEmployee[0].name = '=HYPERLINK("https://example.test")';
  report.byEmployee[0].totals.attendanceRate = null;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await buildWorkbook(report).xlsx.writeBuffer());
  assert.equal(workbook.worksheets.length, 4);
  assert.equal(workbook.getWorksheet('Theo nhân viên').rowCount, 14);
  assert.equal(workbook.getWorksheet('Chi tiết chấm công').rowCount, 53);
  assert.equal(workbook.getWorksheet('Theo ngày').rowCount, 5);
  const staff = workbook.getWorksheet('Theo nhân viên');
  assert.equal(staff.getCell('B2').type, ExcelJS.ValueType.String);
  assert.equal(staff.getCell('B3').value, 'Trần Thị Ánh Nguyệt');
  assert.equal(staff.getCell('I2').value, report.byEmployee[0].totals.workedMinutes / 60);
  assert.equal(staff.getCell('J2').value, null);
  assert.equal(staff.getCell('J3').numFmt, '0.0%');
  assert.equal(workbook.getWorksheet('Chi tiết chấm công').getCell('Q3').value, '08:59');
});

test('PDF embeds Vietnamese font, includes all employee/detail pages and handles empty reports', async () => {
  const font = (await readFile(new URL('./public/fonts/NotoSans-Regular.ttf', import.meta.url))).toString('base64');
  const pdf = await buildPdf(sampleReport(25, 4), font);
  assert.ok(pdf.getNumberOfPages() >= 6);
  const bytes = new Uint8Array(pdf.output('arraybuffer'));
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), '%PDF');
  assert.ok(bytes.length > 40000);
  const empty = await buildPdf(sampleReport(0, 1), font);
  assert.equal(empty.getNumberOfPages(), 3);
});
