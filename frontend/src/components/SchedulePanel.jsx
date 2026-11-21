import {scheduleError} from '../validation';
import {weekdays, workingDaysError, workingDaysLabel} from '../workingDays';
import {useEffect, useState} from 'react';
import {api, labels, localDay} from '../api';
const input = 'border border-gray-200 rounded-xl p-3 w-full mt-1';
function DayPicker({value, onChange, disabled = false}) {
  const select = count => onChange(weekdays.slice(0, count).map(day=>day.value));
  return <fieldset disabled={disabled} className="rounded-xl border border-gray-200 p-4 space-y-3">
    <legend className="px-2 font-semibold">Ngày làm việc trong tuần <span className="text-red-600">*</span></legend>
    <div className="flex flex-wrap gap-4">{weekdays.map(day=><label key={day.value} className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={value.includes(day.value)} onChange={event=>onChange(event.target.checked ? [...value,day.value] : value.filter(item=>item!==day.value))}/>{day.label}
    </label>)}</div>
    <div className="flex flex-wrap gap-2 text-sm">{[[5,'T2–T6'],[6,'T2–T7'],[7,'Cả tuần']].map(([count,label])=><button key={count} type="button" className="rounded-lg border px-3 py-1 text-blue-700" onClick={()=>select(count)}>{label}</button>)}<button type="button" onClick={()=>onChange([])} className="px-2 text-gray-500">Bỏ chọn</button></div>
    <p className="text-xs text-gray-500">Ngày không chọn là ngày nghỉ, không tính vắng. Phải chọn ít nhất một ngày.</p>
  </fieldset>;
}
export default function SchedulePanel({onSaved}) {
  const [shifts, setShifts] = useState([]), [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [draftDays, setDraftDays] = useState({});
  const [schedule, setSchedule] = useState({shiftCode:'', shiftName:'', effectiveFrom:localDay(), workingDays:[], milestones:Object.keys(labels).map(eventType=>({eventType,targetTime:'',windowStart:'',windowEnd:''}))});
  const load = () => api('/shifts').then(setShifts);
  useEffect(()=>{let active=true;api('/shifts').then(result=>{if(active)setShifts(result);}).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const run = async task => {
    setBusy(true);setError('');setMessage('');
    try {await task();await load();onSaved?.();setMessage('Đã lưu lịch và ngày làm việc. Báo cáo chấm công đã được cập nhật.');}
    catch(err){setError(err.message);}finally{setBusy(false);}
  };
  const copySchedule = shift => {
    const tomorrow = new Date(localDay()+'T00:00:00Z'); tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
    setSchedule({shiftCode:'',shiftName:shift.shiftName,effectiveFrom:tomorrow.toISOString().slice(0,10),workingDays:[...shift.workingDays],milestones:shift.milestones.map(point=>({...point}))});
    setMessage('Đã sao chép giờ làm và các ngày đã chọn. Điền mã phiên bản mới, chọn ngày hiệu lực rồi lưu.');setError('');
  };
  return <div className="max-w-4xl space-y-4">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-700">{message}</p>}
    {loading && <p>Đang tải lịch...</p>}
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-3">Lịch làm việc chung</h2>
      <p className="text-sm mb-4 text-gray-600">Chọn cả ngày làm việc và giờ chấm công. Ngày nghỉ không tính vắng. Khi đổi lịch đã lưu, tạo phiên bản có ngày hiệu lực mới để giữ đúng báo cáo quá khứ.</p>
      <div className="space-y-4">{shifts.map(shift=><article key={shift.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold">{shift.shiftName} · {shift.shiftCode} · Từ {shift.effectiveFrom}{shift.effectiveFrom>localDay()?' · Chưa có hiệu lực':''}</h3>
        {shift.workingDaysConfigured && <p className="text-sm text-blue-800">Ngày làm việc: {workingDaysLabel(shift.workingDays)}</p>}
        <details><summary className="cursor-pointer text-sm">Xem giờ chấm công</summary>{shift.milestones.map(point=><p key={point.eventType} className="mt-1 text-sm">{labels[point.eventType]}: {point.targetTime} ({point.windowStart}–{point.windowEnd})</p>)}</details>
        {!shift.workingDaysSaved && <form className="space-y-3" onSubmit={event=>{
          event.preventDefault();const days=draftDays[shift.id] || shift.workingDays || [];const validation=workingDaysError(days);
          if(validation){setError(validation);return;}
          run(()=>api('/shifts/'+shift.id+'/working-days',{method:'PUT',body:{workingDays:days}}));
        }}>
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Lịch này chưa lưu ngày làm việc. Chọn ngày để bổ sung cho phiên bản hiện tại; báo cáo từ ngày hiệu lực của lịch này sẽ được tính theo lựa chọn đó.</p>
          <DayPicker value={draftDays[shift.id] || shift.workingDays || []} onChange={days=>setDraftDays({...draftDays,[shift.id]:days})} disabled={busy}/>
          <button disabled={busy || loading} className="rounded-lg bg-blue-600 p-3 text-white disabled:opacity-50">{busy?'Đang lưu...':'Lưu ngày làm việc cho lịch này'}</button>
        </form>}
        <button type="button" disabled={busy} onClick={()=>copySchedule(shift)} className="text-sm font-semibold text-blue-700 underline">Dùng lịch này làm mẫu cho phiên bản mới</button>
      </article>)}</div>
    </section>
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-3">{shifts.length?'Tạo phiên bản lịch mới':'Tạo lịch đầu tiên'}</h2>
      <form onSubmit={event=>{event.preventDefault();const validation=scheduleError(schedule,shifts.length>0);if(validation){setError(validation);return;}run(()=>api('/shifts',{method:'POST',body:schedule}));}} className="space-y-4">
        <label className="block">Mã phiên bản<input className={input} required pattern="[A-Za-z0-9][A-Za-z0-9_-]*" maxLength={32} value={schedule.shiftCode} onChange={event=>setSchedule({...schedule,shiftCode:event.target.value})}/></label>
        <label className="block">Tên lịch<input className={input} required maxLength={120} value={schedule.shiftName} onChange={event=>setSchedule({...schedule,shiftName:event.target.value})}/></label>
        <label className="block">Hiệu lực từ<input className={input} type="date" required value={schedule.effectiveFrom} onChange={event=>setSchedule({...schedule,effectiveFrom:event.target.value})}/></label>
        <DayPicker value={schedule.workingDays} onChange={days=>setSchedule({...schedule,workingDays:days})} disabled={busy}/>
        <p className="text-xs text-gray-500">Giờ chuẩn phải nằm trong cửa sổ chấm công; các cửa sổ không được chồng lấn.</p>
        <div className="grid grid-cols-4 gap-2 text-sm"><b>Mốc</b><b>Mở cửa sổ</b><b>Giờ chuẩn</b><b>Đóng cửa sổ</b></div>
        {schedule.milestones.map((point,index)=><div key={point.eventType} className="grid grid-cols-4 gap-2 items-center"><span className="text-sm">{labels[point.eventType]}</span>{['windowStart','targetTime','windowEnd'].map(key=><input aria-label={labels[point.eventType]+' '+key} className={input} key={key} type="time" required value={point[key]} onChange={event=>setSchedule({...schedule,milestones:schedule.milestones.map((item,i)=>i===index?{...item,[key]:event.target.value}:item)})}/>)}</div>)}
        <button disabled={busy || loading} className="bg-blue-600 text-white rounded-lg p-3 disabled:opacity-50">{busy?'Đang lưu...':'Lưu phiên bản lịch'}</button>
      </form>
    </section>
  </div>;
}
