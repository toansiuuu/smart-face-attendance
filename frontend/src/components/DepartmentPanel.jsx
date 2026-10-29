import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from './Modal';

const DepartmentPanel = ({ employees = [], onReload }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api('/departments');
      setDepartments(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      description: fd.get('description') || null,
      managerId: fd.get('managerId') ? Number(fd.get('managerId')) : null,
    };
    try {
      if (editing) {
        await api(`/departments/${editing.id}`, { method: 'PATCH', body });
      } else {
        await api('/departments', { method: 'POST', body });
      }
      setShowForm(false);
      setEditing(null);
      load();
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Xóa phòng ban "${dept.name}"? Chỉ xóa được khi không còn nhân viên nào thuộc phòng ban này.`)) return;
    try {
      setError('');
      await api(`/departments/${dept.id}`, { method: 'DELETE' });
      load();
      if (onReload) onReload();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const activeEmployees = employees.filter(e => e.workStatus === 'Đang làm việc');

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Quản lý phòng ban</h3>
          <p className="text-sm text-gray-500 mt-1">Tạo và quản lý cơ cấu tổ chức</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Tạo phòng ban
        </button>
      </div>

      {error && <p className="bg-red-50 text-red-700 p-3 mb-4 rounded-lg">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <p className="text-gray-500 font-medium mb-2">Chưa có phòng ban nào</p>
          <p className="text-sm text-gray-400">Bấm "Tạo phòng ban" để bắt đầu thiết lập cơ cấu tổ chức.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{dept.name}</h4>
                  {dept.description && <p className="text-sm text-gray-500 mt-1">{dept.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(dept)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={() => handleDelete(dept)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-800">{dept.employeeCount}</p>
                    <p className="text-xs text-gray-500">nhân viên</p>
                  </div>
                </div>
                {dept.managerName && (
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold border border-emerald-100">
                      {dept.managerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Trưởng phòng</p>
                      <p className="text-sm font-bold text-gray-700">{dept.managerName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Chỉnh sửa phòng ban' : 'Tạo phòng ban mới'} onClose={() => { setShowForm(false); setEditing(null); }} busy={submitting}>
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-600 mb-3">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên phòng ban *</label>
                <input type="text" name="name" required maxLength={100} defaultValue={editing?.name || ''} placeholder="VD: Phòng Kỹ thuật" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea name="description" maxLength={500} defaultValue={editing?.description || ''} rows={3} placeholder="Mô tả ngắn gọn về phòng ban..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Trưởng phòng</label>
                <select name="managerId" defaultValue={editing?.managerId || ''} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="">— Chưa chỉ định —</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.empId})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors">Hủy</button>
              <button type="submit" disabled={submitting} className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors">
                {submitting ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo phòng ban')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentPanel;
