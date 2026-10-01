import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '../api';
import Modal from './Modal';

export default function PasswordDialog({onClose}) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (values.get('next') !== values.get('confirm')) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setBusy(true); setError('');
    try {
      await api('/auth/password', {method: 'POST', body: {
        currentPassword: values.get('current'), newPassword: values.get('next'),
      }});
      navigate('/login', {replace: true});
    } catch (err) {setError(err.message);} finally {setBusy(false);}
  }
  const input = 'mt-1 w-full rounded-xl border border-gray-200 p-3 focus:outline-blue-500';
  return <Modal title="Đổi mật khẩu" onClose={onClose} busy={busy}>
    <p className="mb-4 text-sm text-gray-500">Sau khi đổi mật khẩu thành công, hãy đăng nhập lại.</p>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold">Mật khẩu hiện tại<input autoFocus name="current" type="password" autoComplete="current-password" required className={input}/></label>
      <label className="block text-sm font-semibold">Mật khẩu mới<input name="next" type="password" autoComplete="new-password" required minLength={12} className={input}/></label>
      <p className="text-xs text-gray-500">Tối thiểu 12 ký tự và tối đa 72 byte UTF-8.</p>
      <label className="block text-sm font-semibold">Xác nhận mật khẩu mới<input name="confirm" type="password" autoComplete="new-password" required minLength={12} className={input}/></label>
      <div className="flex justify-end gap-3 pt-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2">Hủy</button><button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Đổi và đăng nhập lại'}</button></div>
    </form>
  </Modal>;
}
