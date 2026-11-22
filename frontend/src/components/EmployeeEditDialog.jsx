import {useId, useState} from 'react';
import {api, localDay} from '../api';
import {employeeProfile, employeeUpdateBody} from '../employeeProfile';
import {employeeUpdateErrors} from '../validation';
import Modal from './Modal';

function Field({id, label, error, children}) {
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>{children}
    {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}

export default function EmployeeEditDialog({employee, employees, onClose, onSaved}) {
  const prefix = useId();
  const [value, setValue] = useState(() => employeeProfile(employee));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-blue-500 disabled:bg-gray-50';
  const update = event => {
    const next = {...value, [event.target.name]: event.target.value};
    setValue(next); setErrors(employeeUpdateErrors(next, employees, employee)); setSaveError('');
  };
  const props = name => ({id: `${prefix}-${name}`, name, value: value[name], onChange: update,
    'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${prefix}-${name}-error` : undefined, className: input});
  const field = (name, label, children) => <Field id={`${prefix}-${name}`} label={label} error={errors[name]}>{children}</Field>;
  async function submit(event) {
    event.preventDefault();
    const invalid = employeeUpdateErrors(value, employees, employee);
    setErrors(invalid); setSaveError('');
    if (Object.keys(invalid).length) {
      const first = event.currentTarget.elements.namedItem(Object.keys(invalid)[0]);
      first?.focus(); return;
    }
    setBusy(true);
    try {
      const saved = await api(`/employees/${employee.id}`, {method: 'PATCH', body: employeeUpdateBody(value)});
      onSaved(saved);
    } catch (error) {
      setSaveError(error.message);
      if (error.fields) setErrors(error.fields);
    } finally {setBusy(false);}
  }

  return <Modal title="Chỉnh sửa hồ sơ nhân viên" onClose={onClose} busy={busy}>
    <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-900">Mã nhân viên / tên đăng nhập: {employee.empId}</p>
      <p className="mt-1 text-xs leading-5 text-blue-800">Cập nhật trên hồ sơ cũ sẽ giữ nguyên khuôn mặt và lịch sử chấm công.</p>
    </div>
    <form noValidate onSubmit={submit}>
      <fieldset disabled={busy} className="space-y-4">
        {field('fullName', 'Họ và tên *', <input {...props('fullName')} autoFocus type="text" required maxLength={150} autoComplete="name"/>)}
        {field('email', 'Email nhận mã khôi phục mật khẩu *', <input {...props('email')} type="email" required maxLength={255} autoComplete="email"/>)}
        <p className="-mt-2 text-xs leading-5 text-gray-500">Nếu mất quyền truy cập email cũ, nhập email mới mà nhân viên đang sử dụng. Sau khi lưu, mã trong mục “Quên mật khẩu” sẽ gửi tới email này.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('phone', 'Số điện thoại', <input {...props('phone')} type="tel" inputMode="numeric" maxLength={11} autoComplete="tel-national" placeholder="VD: 0912345678"/>)}
          {field('position', 'Chức vụ', <input {...props('position')} type="text" maxLength={100} autoComplete="organization-title"/>)}
          {field('dateOfBirth', 'Ngày sinh', <input {...props('dateOfBirth')} type="date" max={localDay()}/>)}
          {field('gender', 'Giới tính', <select {...props('gender')}><option value="">Chưa chỉ định</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select>)}
        </div>
        {field('status', 'Trạng thái tài khoản', <select {...props('status')}><option value="ACTIVE">Đang làm việc — cho phép đăng nhập, chấm công</option><option value="INACTIVE">Ngừng hoạt động — chặn đăng nhập, chấm công</option></select>)}
        <p className="text-xs leading-5 text-gray-500">Với nhân viên quay lại làm việc, chọn “Đang làm việc” để kích hoạt lại tài khoản hiện có.</p>
      </fieldset>
      {saveError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm disabled:opacity-50">Hủy</button>
        <button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  </Modal>;
}
