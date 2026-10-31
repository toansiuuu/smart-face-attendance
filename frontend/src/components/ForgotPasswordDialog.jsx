import {useEffect, useState} from 'react';
import {api} from '../api';
import Modal from './Modal';

export default function ForgotPasswordDialog({initialUsername, onClose}) {
  const [username, setUsername] = useState(initialUsername || '');
  const [channel, setChannel] = useState('EMAIL');
  const [contact, setContact] = useState('');
  const [options, setOptions] = useState(null);
  const [stage, setStage] = useState('REQUEST');
  const [requestId, setRequestId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api('/auth/password-recovery/options').then(result => {
      if (!active) return;
      setOptions(result);
      if (!result.emailEnabled && result.smsEnabled) setChannel('SMS');
    }).catch(err => {if (active) setError(err.message);});
    return () => {active = false;};
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(event) {
    event?.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api('/auth/password-recovery/request',
        {method: 'POST', body: {username, channel, contact}});
      setRequestId(result.requestId); setMessage(result.message);
      setCooldown(result.retryAfterSeconds); setCode(''); setStage('CODE');
    } catch (err) {setError(err.message); if (err.status === 429) setCooldown(60);}
    finally {setBusy(false);}
  }

  async function resetPassword(event) {
    event.preventDefault(); setError('');
    if (password !== confirm) {setError('Hai mật khẩu mới chưa khớp.'); return;}
    setBusy(true);
    try {
      const result = await api('/auth/password-recovery/reset',
        {method: 'POST', body: {requestId, code, newPassword: password}});
      setPassword(''); setConfirm(''); setCode(''); setMessage(result.message); setStage('DONE');
    } catch (err) {setError(err.message);} finally {setBusy(false);}
  }

  const available = options && (channel === 'EMAIL' ? options.emailEnabled : options.smsEnabled);
  const input = 'mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm';
  return <Modal title="Quên mật khẩu" onClose={onClose} busy={busy}>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {stage === 'REQUEST' && <>
      <p className="mb-4 text-sm text-gray-600">Nhập tài khoản và email hoặc số điện thoại đã đăng ký trong hồ sơ. Bạn sẽ nhận mã xác minh để đặt mật khẩu mới.</p>
      {!options && !error && <p role="status" className="mb-4 text-sm">Đang kiểm tra kênh gửi mã...</p>}
      {options && !options.emailEnabled && !options.smsEnabled && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Hệ thống chưa cấu hình gửi email/SMS. Vui lòng liên hệ quản trị viên để bật chức năng này.</p>}
      <form onSubmit={sendCode} className="space-y-4">
        <label className="block text-sm font-medium">Tài khoản / Mã nhân viên
          <input required maxLength={80} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className={input}/>
        </label>
        <label className="block text-sm font-medium">Nhận mã qua
          <select value={channel} onChange={e => {setChannel(e.target.value); setContact('');}} className={input}>
            <option value="EMAIL" disabled={!options?.emailEnabled}>Email{options && !options.emailEnabled ? ' (chưa bật)' : ''}</option>
            <option value="SMS" disabled={!options?.smsEnabled}>Tin nhắn SMS{options && !options.smsEnabled ? ' (chưa bật)' : ''}</option>
          </select>
        </label>
        <label className="block text-sm font-medium">{channel === 'EMAIL' ? 'Email đã đăng ký' : 'Số điện thoại đã đăng ký'}
          <input required maxLength={254} type={channel === 'EMAIL' ? 'email' : 'tel'} autoComplete={channel === 'EMAIL' ? 'email' : 'tel'} value={contact} onChange={e => setContact(e.target.value)} placeholder={channel === 'EMAIL' ? 'ban@example.com' : '09xxxxxxxx hoặc +849xxxxxxxx'} className={input}/>
        </label>
        <button disabled={busy || !available || cooldown > 0} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang yêu cầu...' : cooldown > 0 ? `Thử lại sau ${cooldown}s` : 'Gửi mã xác minh'}</button>
      </form>
    </>}
    {stage === 'CODE' && <>
      <p role="status" className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{message} Mã có hiệu lực 10 phút, tối đa 5 lần nhập sai. Kiểm tra cả thư rác nếu dùng email.</p>
      <form onSubmit={resetPassword} className="space-y-4">
        <label className="block text-sm font-medium">Mã xác minh 6 chữ số
          <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={input}/>
        </label>
        <label className="block text-sm font-medium">Mật khẩu mới
          <input required type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} className={input}/>
          <span className="mt-1 block text-xs text-gray-500">Ít nhất 12 ký tự, tối đa 72 byte UTF-8.</span>
        </label>
        <label className="block text-sm font-medium">Nhập lại mật khẩu mới
          <input required type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirm} onChange={e => setConfirm(e.target.value)} className={input}/>
        </label>
        <button disabled={busy} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</button>
      </form>
      <div className="mt-4 flex justify-between gap-3 text-sm">
        <button disabled={busy || cooldown > 0} onClick={() => sendCode()} className="text-blue-700 disabled:text-gray-400">{cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}</button>
        <button disabled={busy} onClick={() => {setStage('REQUEST'); setError('');}} className="text-gray-600">Đổi thông tin</button>
      </div>
    </>}
    {stage === 'DONE' && <>
      <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p>
      <button onClick={onClose} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white">Quay lại đăng nhập</button>
    </>}
  </Modal>;
}
