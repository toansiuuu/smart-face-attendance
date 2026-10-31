import {useEffect, useState} from 'react';
import {api} from '../api';
import Modal from './Modal';

export default function ForgotPasswordDialog({initialUsername, onClose}) {
  const [username, setUsername] = useState(initialUsername || '');
  const channel = 'EMAIL';
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
        {method: 'POST', body: {username, channel}});
      setRequestId(result.requestId); setMessage(result.message);
      setCooldown(result.retryAfterSeconds); setCode(''); setPassword(''); setConfirm(''); setStage('CODE');
    } catch (err) {setError(err.message); if (err.status === 429) setCooldown(60);}
    finally {setBusy(false);}
  }

  async function verifyCode(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api('/auth/password-recovery/verify',
        {method: 'POST', body: {requestId, code}});
      setMessage(result.message); setStage('PASSWORD');
    } catch (err) {setError(err.message);} finally {setBusy(false);}
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

  const available = options?.emailEnabled;
  const input = 'mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm';
  return <Modal title="Quên mật khẩu" onClose={onClose} busy={busy}>
    {stage !== 'DONE' && <ol className="mb-5 flex flex-wrap gap-3 text-xs text-gray-500" aria-label="Các bước lấy lại mật khẩu">
      {['Nhận mã', 'Xác minh mã', 'Đặt mật khẩu mới'].map((label, index) => <li key={label}
        aria-current={index === {REQUEST: 0, CODE: 1, PASSWORD: 2}[stage] ? 'step' : undefined}
        className={index === {REQUEST: 0, CODE: 1, PASSWORD: 2}[stage] ? 'font-semibold text-blue-700' : ''}>{index + 1}. {label}</li>)}
    </ol>}
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {stage === 'REQUEST' && <>
      <p className="mb-4 text-sm text-gray-600">Nhập tài khoản/mã nhân viên. Mã xác minh sẽ được gửi đến email của bạn đã lưu khi tạo tài khoản.</p>
      {!options && !error && <p role="status" className="mb-4 text-sm">Đang kiểm tra kênh gửi mã...</p>}
      {options && !options.emailEnabled && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Ứng dụng chưa cấu hình dịch vụ gửi email nên chưa thể gửi mã. Người dùng không cần cung cấp mật khẩu Gmail.</p>}
      <form onSubmit={sendCode} className="space-y-4">
        <label className="block text-sm font-medium">Tài khoản / Mã nhân viên
          <input required maxLength={80} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className={input}/>
        </label>
        <p className="text-sm text-gray-500">Mã sẽ được gửi đến email đã đăng ký của tài khoản này.</p>
        <button disabled={busy || !available || cooldown > 0} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang yêu cầu...' : cooldown > 0 ? `Thử lại sau ${cooldown}s` : 'Xác nhận gửi mã qua email'}</button>
      </form>
    </>}
    {stage === 'CODE' && <>
      <p role="status" className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{message} Mã có hiệu lực 10 phút, tối đa 5 lần nhập sai. Kiểm tra cả thư rác nếu dùng email.</p>
      <form onSubmit={verifyCode} className="space-y-4">
        <label className="block text-sm font-medium">Mã xác minh 6 chữ số
          <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={input}/>
        </label>
        <button disabled={busy} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang xác minh...' : 'Xác nhận mã'}</button>
      </form>
      <div className="mt-4 flex justify-between gap-3 text-sm">
        <button disabled={busy || cooldown > 0} onClick={() => sendCode()} className="text-blue-700 disabled:text-gray-400">{cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}</button>
        <button disabled={busy} onClick={() => {setStage('REQUEST'); setCode(''); setError('');}} className="text-gray-600">Chọn lại tài khoản</button>
      </div>
    </>}
    {stage === 'PASSWORD' && <>
      <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
      <form onSubmit={resetPassword} className="space-y-4">
        <label className="block text-sm font-medium">Mật khẩu mới
          <input required type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} className={input}/>
          <span className="mt-1 block text-xs text-gray-500">Ít nhất 12 ký tự, tối đa 72 byte UTF-8.</span>
        </label>
        <label className="block text-sm font-medium">Nhập lại mật khẩu mới
          <input required type="password" autoComplete="new-password" minLength={12} maxLength={72} value={confirm} onChange={e => setConfirm(e.target.value)} className={input}/>
        </label>
        <button disabled={busy} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</button>
      </form>
      <button disabled={busy} onClick={() => {setStage('CODE'); setCode(''); setPassword(''); setConfirm(''); setMessage('Nhập mã trong email, hoặc yêu cầu gửi lại mã.'); setError('');}} className="mt-4 text-sm text-blue-700">Nhập lại mã xác minh</button>
    </>}
    {stage === 'DONE' && <>
      <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p>
      <button onClick={onClose} className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white">Quay lại đăng nhập</button>
    </>}
  </Modal>;
}
