import {useEffect, useId, useState} from 'react';
import {api, localDay} from '../api';
import {chartSeries, employeeRows, formatDate, hours, percent, rangeError, reportNotes, reportRange} from '../reports';
import './ReportsPanel.css';

const metrics = [
  ['presentDays', 'Ngày có mặt', 'Có ít nhất một lần quét', 'green'],
  ['absentDays', 'Ngày vắng', 'Đã kết thúc cửa sổ quét', 'red'],
  ['lateDays', 'Ngày đi muộn', 'Theo lịch và thời gian ân hạn', 'amber'],
  ['workedMinutes', 'Tổng giờ làm', 'Tính từ các cặp vào / ra đủ dữ liệu', 'blue'],
];

function DailyChart({days}) {
  const id = useId();
  const {mode, items} = chartSeries(days);
  const width = Math.max(600, items.length * 35 + 65), height = 230, top = 22, bottom = 185;
  const max = Math.max(1, ...items.flatMap(g => [g.presentDays, g.absentDays, g.lateDays]));
  const step = (width - 65) / Math.max(items.length, 1), bar = Math.min(10, step / 4);
  const series = [['presentDays', '#059669', 'Có mặt'], ['absentDays', '#ef4444', 'Vắng'], ['lateDays', '#f59e0b', 'Đi muộn']];
  return <div>
    <div className="rp-chart-head"><div><h3>Xu hướng chấm công</h3><p>Theo {mode === 'month' ? 'tháng' : mode === 'week' ? 'tuần' : 'ngày'} · đơn vị: ngày–nhân viên</p></div>
      <div className="rp-legend">{series.map(([key, color, label]) => <span key={key}><i style={{background: color}}/>{label}</span>)}</div>
    </div>
    <div className="rp-chart-scroll" tabIndex="0" aria-label="Biểu đồ có thể cuộn ngang">
      <svg role="img" aria-labelledby={id} viewBox={`0 0 ${width} ${height}`} style={{minWidth: width}}>
        <title id={id}>Số ngày có mặt, vắng và đi muộn. Đi muộn là một phần của ngày có mặt.</title>
        {[0, 1, 2, 3, 4].map(n => {const y = bottom - (bottom - top) * n / 4; return <g key={n}>
          <line x1="44" x2={width - 10} y1={y} y2={y} stroke="#e2e8f0"/>
          <text x="36" y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">{Number((max * n / 4).toFixed(1))}</text>
        </g>;})}
        {items.map((g, index) => <g key={g.key}>
          {series.map(([field, color, label], i) => {const h = g[field] / max * (bottom - top); return <rect key={field}
            x={48 + step * index + step / 2 + (i - 1.5) * bar} y={bottom - h} width={bar - 1} height={h} rx="2" fill={color}>
            <title>{formatDate(g.from)}{g.from !== g.to ? ` - ${formatDate(g.to)}` : ''}: {label} {g[field]}</title>
          </rect>;})}
          <text x={48 + step * index + step / 2} y="206" textAnchor="middle" fill="#64748b" fontSize="10">{g.label}</text>
        </g>)}
      </svg>
    </div>
    <p className="rp-chart-note">Đi muộn là một phần của ngày có mặt. Rê chuột lên cột để xem số liệu; bảng chi tiết ở bên dưới.</p>
  </div>;
}

function StaffHours({rows}) {
  const top = [...rows].sort((a, b) => b.totals.workedMinutes - a.totals.workedMinutes || a.empId.localeCompare(b.empId)).slice(0, 5);
  const max = Math.max(1, ...top.map(r => r.totals.workedMinutes));
  return <div><h3>Giờ làm theo nhân viên</h3><p className="rp-muted">5 nhân viên có nhiều giờ được ghi nhận nhất trong kỳ</p>
    <div className="rp-hours">{top.length ? top.map(row => <div key={row.employeeId}>
      <div><span title={row.name}>{row.name} <small>{row.empId}</small></span><strong>{hours(row.totals.workedMinutes)} giờ</strong></div>
      <div className="rp-track"><span style={{width: `${row.totals.workedMinutes / max * 100}%`}}/></div>
    </div>) : <p className="rp-muted">Chưa có nhân viên trong bộ lọc.</p>}</div>
    <p className="rp-chart-note">Số giờ phụ thuộc các cặp vào / ra đầy đủ, chưa dùng để xếp loại hiệu suất.</p>
  </div>;
}

function Details({report, employee, onClose}) {
  const [page, setPage] = useState(1);
  const rows = report.details.filter(row => row.employeeId === employee.employeeId);
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  return <section className="rp-card" aria-label={`Chi tiết ${employee.name}`}>
    <div className="rp-section-head"><div><h3>Chi tiết: {employee.name}</h3><p>{employee.empId} · Giờ sau chỉnh sửa đã duyệt</p></div>
      <button type="button" className="rp-button" onClick={onClose}>Đóng chi tiết</button></div>
    <div className="rp-table-wrap"><table><thead><tr><th>Ngày</th><th>Vào sáng</th><th>Ra trưa</th><th>Vào chiều</th><th>Ra chiều</th><th>Giờ làm</th><th>Kết quả</th></tr></thead>
      <tbody>{rows.slice((page - 1) * 10, page * 10).map(row => <tr key={row.id}><td>{formatDate(row.date)}</td>
        {['MORNING_IN', 'LUNCH_OUT', 'AFTERNOON_IN', 'WORK_OUT'].map(key => <td key={key}>{row.milestones[key]}</td>)}
        <td>{hours(row.workedMinutes)}</td><td><span className="rp-badge">{row.status}</span><div className="rp-flags">
          {row.late && 'Muộn · '}{row.early && 'Về sớm · '}{row.corrected && 'Đã chỉnh sửa'}</div></td></tr>)}
        {!rows.length && <tr><td colSpan="7" className="rp-empty">Không có dữ liệu trong khoảng ngày này.</td></tr>}</tbody></table></div>
    <Pager page={page} pages={pages} total={rows.length} onPage={setPage}/>
  </section>;
}

function Pager({page, pages, total, onPage}) {
  return <div className="rp-pager"><span>{total} dòng · Trang {page}/{pages}</span><div>
    <button type="button" className="rp-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trước</button>
    <button type="button" className="rp-button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Sau</button>
  </div></div>;
}

export default function ReportsPanel({employees, reload}) {
  const today = localDay();
  const [draft, setDraft] = useState(() => reportRange('month', today));
  const [applied, setApplied] = useState(() => reportRange('month', today));
  const [request, setRequest] = useState(0);
  const [state, setState] = useState({data: null, loading: true, error: ''});
  const [validation, setValidation] = useState('');
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('workedMinutes');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setState({data: null, loading: true, error: ''});
      const params = new URLSearchParams({from: applied.from, to: applied.to});
      if (applied.employeeId) params.set('employeeId', applied.employeeId);
      return api(`/reports/attendance?${params}`, {signal: controller.signal});
    }).then(data => {
      if (!controller.signal.aborted) {setState({data, loading: false, error: ''}); setPage(1); setSelectedId(null);}
    }).catch(error => {
      if (!controller.signal.aborted) setState({data: null, loading: false, error: error.message});
    });
    return () => controller.abort();
  }, [applied, request, reload]);

  const {data, loading, error} = state;
  const changed = Object.keys(draft).some(key => draft[key] !== applied[key]);
  const rows = employeeRows(data?.byEmployee || [], search, sort);
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const visiblePage = Math.min(page, pages);
  const selected = data?.byEmployee.find(row => row.employeeId === selectedId);
  const apply = event => {
    event.preventDefault();
    const message = rangeError(draft.from, draft.to, today);
    setValidation(message);
    if (message) return;
    setApplied({...draft}); setRequest(value => value + 1); setExportError('');
  };
  const download = async type => {
    if (!data || loading || exporting) return;
    setExporting(type); setExportError('');
    try {
      const {downloadReport} = await import('../report-export');
      await downloadReport(type, data);
    } catch (e) {setExportError(`Không thể xuất báo cáo: ${e.message}`);}
    finally {setExporting('');}
  };

  return <div className="reports-panel" aria-busy={loading}>
    <section className="rp-card rp-filter">
      <div className="rp-section-head"><div><span className="rp-eyebrow">PHÂN TÍCH CHẤM CÔNG</span><h3>Theo dõi cả kỳ, xem đến từng ngày</h3><p>Tổng hợp từ dữ liệu chấm công và các chỉnh sửa đã được duyệt.</p></div>
        <div className="rp-actions"><button type="button" className="rp-button" disabled={!data || loading || !!exporting} onClick={() => download('xlsx')}>{exporting === 'xlsx' ? 'Đang xuất…' : 'Xuất Excel'}</button>
          <button type="button" className="rp-button rp-primary" disabled={!data || loading || !!exporting} onClick={() => download('pdf')}>{exporting === 'pdf' ? 'Đang xuất…' : 'Xuất PDF'}</button></div></div>
      <form onSubmit={apply} noValidate>
        <div className="rp-fields">
          <label>Từ ngày<input type="date" required max={today} value={draft.from} onChange={e => setDraft({...draft, from: e.target.value})}/></label>
          <label>Đến ngày<input type="date" required max={today} value={draft.to} onChange={e => setDraft({...draft, to: e.target.value})}/></label>
          <label>Nhân viên<select value={draft.employeeId} onChange={e => setDraft({...draft, employeeId: e.target.value})}><option value="">Tất cả nhân viên</option>{employees.map(e => <option key={e.id} value={e.id}>{e.empId} - {e.name}{e.status === 'INACTIVE' ? ' (ngừng hoạt động)' : ''}</option>)}</select></label>
          <button type="submit" className="rp-button rp-primary" disabled={loading}>Áp dụng bộ lọc</button>
        </div>
        <div className="rp-presets">{[['month', 'Tháng này'], ['previous', 'Tháng trước'], ['7', '7 ngày qua'], ['30', '30 ngày qua']].map(([key, label]) => <button key={key} type="button" onClick={() => {setDraft({...reportRange(key, today), employeeId: draft.employeeId}); setValidation('');}}>{label}</button>)}
          {changed && <span>Nhấn “Áp dụng bộ lọc” để cập nhật.</span>}</div>
        {validation && <p role="alert" className="rp-error">{validation}</p>}
      </form>
      <p className="rp-export-note">Xuất toàn bộ dữ liệu của kỳ và nhân viên đã áp dụng, không giới hạn theo trang hoặc ô tìm kiếm bên dưới.</p>
    </section>
    {exportError && <p role="alert" className="rp-alert rp-error">{exportError}</p>}
    {loading && <div className="rp-card rp-empty" role="status">Đang tổng hợp báo cáo…</div>}
    {error && <div role="alert" className="rp-alert rp-error">{error} <button type="button" className="rp-button" onClick={() => setRequest(x => x + 1)}>Thử lại</button></div>}
    {data && !loading && <>
      <div className="rp-period"><strong>{formatDate(data.from)} - {formatDate(data.to)}</strong><span>{data.employeeCount} nhân viên · Cập nhật {data.generatedAt.slice(11, 16)} ngày {formatDate(data.generatedAt.slice(0, 10))} (GMT+7)</span></div>
      {data.totals.unconfiguredDays > 0 && <p className="rp-alert rp-warning" role="status">Có {data.totals.unconfiguredDays} ngày–nhân viên chưa đủ cấu hình lịch. Các ngày này chưa tính vắng hoặc đưa vào tỷ lệ có mặt.</p>}
      {data.totals.invalidDays > 0 && <p className="rp-alert rp-error">Có {data.totals.invalidDays} ngày có giờ sai thứ tự. Giờ làm của các ngày này được loại khỏi tổng; cần kiểm tra tại bảng công.</p>}
      {data.details.length === 0 && <p className="rp-alert rp-warning">Không có dữ liệu phù hợp. Thử khoảng ngày sau khi tạo nhân viên hoặc chọn nhân viên khác.</p>}
      <div className="rp-kpis">{metrics.map(([key, label, note, color]) => <article key={key} className={`rp-kpi rp-${color}`}><p>{label}</p><strong>{key === 'workedMinutes' ? hours(data.totals[key]) : data.totals[key]}<small>{key === 'workedMinutes' ? 'giờ' : 'ngày'}</small></strong><span>{note}</span></article>)}</div>
      <div className="rp-secondary"><div><span>Tỷ lệ có mặt theo lịch</span><strong>{percent(data.totals.attendanceRate)}</strong></div><div><span>Đủ 4 mốc</span><strong>{data.totals.completeDays} ngày</strong></div><div><span>Thiếu mốc</span><strong>{data.totals.incompleteDays} ngày</strong></div><div><span>Về sớm</span><strong>{data.totals.earlyDays} ngày</strong></div><div><span>Đang chờ chốt</span><strong>{data.totals.pendingDays} ngày</strong></div><div><span>Đã chỉnh sửa</span><strong>{data.totals.correctedDays} ngày</strong></div></div>
      <div className="rp-card"><DailyChart days={data.byDate}/></div>
      <div className="rp-card"><StaffHours rows={data.byEmployee}/></div>
      <section className="rp-card">
        <div className="rp-section-head"><div><h3>Tổng hợp từng nhân viên</h3><p>Chọn “Chi tiết” để đối chiếu các mốc chấm công.</p></div><div className="rp-table-filters">
          <input aria-label="Tìm nhân viên trong báo cáo" placeholder="Tìm tên hoặc mã nhân viên" maxLength="100" value={search} onChange={e => {setSearch(e.target.value); setPage(1);}}/>
          <select aria-label="Sắp xếp tổng hợp" value={sort} onChange={e => {setSort(e.target.value); setPage(1);}}><option value="workedMinutes">Giờ làm giảm dần</option><option value="lateDays">Đi muộn giảm dần</option><option value="absentDays">Ngày vắng giảm dần</option><option value="name">Tên A - Z</option></select>
        </div></div>
        <div className="rp-table-wrap"><table><thead><tr><th>Nhân viên</th><th>Có mặt</th><th>Vắng</th><th>Muộn</th><th>Về sớm</th><th>Thiếu mốc</th><th>Giờ làm</th><th>Tỷ lệ</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
          <tbody>{rows.slice((visiblePage - 1) * 10, visiblePage * 10).map(row => <tr key={row.employeeId}><td><strong>{row.name}</strong><small>{row.empId}{row.status === 'INACTIVE' && ' · Ngừng hoạt động'}</small></td><td>{row.totals.presentDays}</td><td>{row.totals.absentDays}</td><td>{row.totals.lateDays}</td><td>{row.totals.earlyDays}</td><td>{row.totals.incompleteDays}</td><td><strong>{hours(row.totals.workedMinutes)}</strong></td><td>{percent(row.totals.attendanceRate)}</td><td><button type="button" className="rp-link" onClick={() => setSelectedId(row.employeeId)} aria-label={`Chi tiết ${row.name}`}>Chi tiết</button></td></tr>)}
            {!rows.length && <tr><td colSpan="9" className="rp-empty">Không có nhân viên phù hợp.</td></tr>}</tbody></table></div>
        <Pager page={visiblePage} pages={pages} total={rows.length} onPage={setPage}/>
      </section>
      {selected && <Details key={`${selected.employeeId}-${data.generatedAt}`} report={data} employee={selected} onClose={() => setSelectedId(null)}/>}
      <details className="rp-card rp-explanation"><summary>Cách tính số liệu</summary><ul>{reportNotes.map(note => <li key={note}>{note}</li>)}</ul><p>Ngày–nhân viên là một nhân viên trong một ngày. Các chỉ số trên toàn hệ thống dùng đơn vị này. Thời gian theo GMT+7.</p></details>
    </>}
  </div>;
}
