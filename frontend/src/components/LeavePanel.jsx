import { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from './Modal';

const TYPES = { ANNUAL: 'Nghỉ phép năm', SICK: 'Nghỉ ốm', PERSONAL: 'Nghỉ việc riêng', OTHER: 'Khác' };
const STATUSES = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy' };
const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function LeavePanel({ role }) {
  const isManager = role === 'MANAGER';
  const [tab, setTab] = useState(isManager ? 'pending' : 'mine');
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    const url = tab === 'pending' ? '/leave-requests?status=PENDING' : '/leave-requests';
    Promise.all([api(url), !isManager ? api('/leave-balance') : Promise.resolve(null)])
      .then(([reqs, bal]) => { setRequests(reqs); if (bal) setBalance(bal); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [tab]);

  const handleCreate = async (ev) => {
    ev.preventDefault(); setError('');
    const fd = new FormData(ev.currentTarget);
    try {
      await api('/leave-requests', { method: 'POST', body: { leaveType: fd.get('leaveType'), startDate: fd.get('startDate'), endDate: fd.get('endDate'), reason: fd.get('reason') } });
      setShowForm(false); load();
    } catch (e) { setError(e.message); }
  };

  const handleReview = async (id, approved) => {
    const note = approved ? '' : (prompt('Lý do từ chối:') || '');
    if (!approved && !note) return;
    try { await api(`/leave-requests/${id}/review`, { method: 'POST', body: { approve: approved, note } }); load(); } catch (e) { setError(e.message); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Hủy đơn nghỉ phép này?')) return;
    try { await api(`/leave-requests/${id}/cancel`, { method: 'POST' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý nghỉ phép</h2>
          {balance && <p className="text-sm text-gray-500 mt-1">Phép năm: còn {balance.annualRemaining}/{balance.annualAllowance} ngày</p>}
        </div>
        <div className="flex items-center gap-3">
          {isManager && <>
            <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Chờ duyệt</button>
            <button onClick={() => setTab('mine')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'mine' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Tất cả</button>
          </>}
          {!isManager && <button onClick={() => { setShowForm(true); setError(''); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors">+ Xin nghỉ phép</button>}
        </div>
      </div>

      {error && <p className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</p>}

      {loading ? <p className="text-gray-500">Đang tải...</p> : requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <p className="text-gray-400 text-lg">{tab === 'pending' ? 'Không có đơn chờ duyệt' : 'Chưa có đơn nghỉ phép nào'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {r.employeeName && <p className="text-sm font-bold text-gray-800 mb-1">{r.employeeName}</p>}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>{STATUSES[r.status]}</span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">{TYPES[r.leaveType]}</span>
                  </div>
                  <p className="text-sm text-gray-700"><span className="font-mono font-bold">{r.startDate}</span> → <span className="font-mono font-bold">{r.endDate}</span></p>
                  <p className="text-sm text-gray-500 mt-1">{r.reason}</p>
                  {r.reviewNote && <p className="text-sm text-gray-400 mt-1 italic">Ghi chú: {r.reviewNote}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  {isManager && r.status === 'PENDING' && <>
                    <button onClick={() => handleReview(r.id, true)} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium">Duyệt</button>
                    <button onClick={() => handleReview(r.id, false)} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium">Từ chối</button>
                  </>}
                  {!isManager && r.status === 'PENDING' && <button onClick={() => handleCancel(r.id)} className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Hủy</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Xin nghỉ phép" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại nghỉ phép</label>
              <select name="leaveType" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500">
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Từ ngày</label>
                <input type="date" name="startDate" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Đến ngày</label>
                <input type="date" name="endDate" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Lý do</label>
              <textarea name="reason" required maxLength={500} rows={3} placeholder="Nhập lý do nghỉ phép..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Hủy</button>
              <button type="submit" className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm">Gửi đơn</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
