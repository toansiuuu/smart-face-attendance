import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from './Modal';

export default function HolidayPanel() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); api(`/holidays?year=${year}`).then(setHolidays).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(load, [year]);

  const handleSubmit = async (ev) => {
    ev.preventDefault(); setError('');
    const fd = new FormData(ev.currentTarget);
    const body = { date: fd.get('date'), name: fd.get('name'), isRecurring: fd.get('isRecurring') === 'on' };
    try {
      if (editing) await api(`/holidays/${editing.id}`, { method: 'PATCH', body });
      else await api('/holidays', { method: 'POST', body });
      setShowForm(false); setEditing(null); load();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa ngày lễ này?')) return;
    try { await api(`/holidays/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý ngày lễ</h2>
          <p className="text-sm text-gray-500 mt-1">Ngày lễ được tự động loại trừ khỏi bảng chấm công</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">←</button>
          <span className="text-lg font-bold text-gray-800 min-w-[60px] text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">→</button>
          <button onClick={() => { setEditing(null); setShowForm(true); setError(''); }} className="ml-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors">+ Thêm ngày lễ</button>
        </div>
      </div>

      {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</p>}

      {loading ? <p className="text-gray-500">Đang tải...</p> : holidays.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <p className="text-gray-400 text-lg">Chưa có ngày lễ nào cho năm {year}</p>
          <p className="text-gray-400 text-sm mt-1">Nhấn "Thêm ngày lễ" để bắt đầu</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-gray-100">
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Ngày</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Tên ngày lễ</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Loại</th>
              <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Thao tác</th>
            </tr></thead>
            <tbody>
              {holidays.map(h => {
                const isPast = h.date < today;
                return (
                  <tr key={h.id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${isPast ? 'opacity-60' : ''}`}>
                    <td className="p-4 text-sm font-mono font-bold text-gray-800">{h.date}</td>
                    <td className="p-4 text-sm text-gray-700 font-medium">{h.name}</td>
                    <td className="p-4"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${h.isRecurring ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{h.isRecurring ? 'Hàng năm' : 'Một lần'}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setEditing(h); setShowForm(true); setError(''); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Sửa</button>
                      <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Sửa ngày lễ' : 'Thêm ngày lễ'} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày</label>
              <input type="date" name="date" required defaultValue={editing?.date || ''} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên ngày lễ</label>
              <input type="text" name="name" required maxLength={100} defaultValue={editing?.name || ''} placeholder="VD: Tết Nguyên Đán" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isRecurring" defaultChecked={editing?.isRecurring || false} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Lặp lại hàng năm</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Hủy</button>
              <button type="submit" className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm">Lưu</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
