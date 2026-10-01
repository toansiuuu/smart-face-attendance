import {useEffect, useState} from 'react';
import {api, labels, localDay} from '../api';
const input = 'border border-gray-200 rounded-xl p-3 w-full mt-1';
export default function SchedulePanel() {
  const [shifts, setShifts] = useState([]), [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({shiftCode: '', shiftName: '', effectiveFrom: localDay(), milestones: Object.keys(labels).map(eventType => ({eventType, targetTime: '', windowStart: '', windowEnd: ''}))});
  const load = () => api('/shifts').then(setShifts);
  useEffect(() => {let active = true; api('/shifts').then(s => {if(active) setShifts(s);}).catch(e => {if(active) setError(e.message);}).finally(() => {if(active) setLoading(false);}); return () => {active = false;};}, []);
  const run = async task => {setBusy(true); setError(''); setMessage(''); try {await task(); setMessage('Đã lưu lịch làm việc chung.');} catch(e) {setError(e.message);} finally {setBusy(false);}};
  return <div className="max-w-4xl space-y-4">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-700">{message}</p>}
    {loading && <p>Đang tải lịch...</p>}
 <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"><h2 className="text-xl font-bold mb-3">Lịch cố định cho tất cả nhân viên</h2><p className="text-sm mb-4">Đây là lịch cố định áp dụng chung cho tất cả nhân viên, không phải phân ca. Chỉ tạo phiên bản mới khi giờ làm chung thay đổi; lịch cũ vẫn được giữ để xem công quá khứ. Giờ chuẩn dùng để xét đi muộn/về sớm; cửa sổ giờ là khoảng được phép chấm công.</p>
 {shifts.map(s=><details key={s.id} className="rounded-xl p-3 border border-gray-200 mb-3"><summary>{s.shiftName} · {s.effectiveFrom}</summary>{s.milestones.map(m=><p key={m.eventType}>{labels[m.eventType]}: {m.targetTime} ({m.windowStart}–{m.windowEnd})</p>)}</details>)}
 <form onSubmit={e=>{e.preventDefault();run(async()=>{await api('/shifts',{method:'POST',body:schedule});await load();});}} className="space-y-3 mt-4">
 <label className="block">Mã phiên bản<input className={input} required maxLength={32} value={schedule.shiftCode} onChange={e=>setSchedule({...schedule,shiftCode:e.target.value})}/></label>
 <label className="block">Tên lịch<input className={input} required maxLength={120} value={schedule.shiftName} onChange={e=>setSchedule({...schedule,shiftName:e.target.value})}/></label>
 <label className="block">Hiệu lực từ<input className={input} type="date" required value={schedule.effectiveFrom} onChange={e=>setSchedule({...schedule,effectiveFrom:e.target.value})}/></label>
 <div className="grid grid-cols-4 gap-2"><b>Mốc</b><b>Mở cửa sổ</b><b>Giờ chuẩn</b><b>Đóng cửa sổ</b></div>
 {schedule.milestones.map((m,i)=><div key={m.eventType} className="grid grid-cols-4 gap-2 items-center"><label>{labels[m.eventType]}</label>{['windowStart','targetTime','windowEnd'].map(k=><input aria-label={`${labels[m.eventType]} ${k}`} className={input} key={k} type="time" required value={m[k]} onChange={e=>setSchedule({...schedule,milestones:schedule.milestones.map((x,j)=>j===i?{...x,[k]:e.target.value}:x)})}/>)}</div>)}
 <button disabled={busy} className="bg-blue-600 text-white rounded p-3">Tạo phiên bản lịch</button></form></section>
 </div>;
}
