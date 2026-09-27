import React, { useState, useEffect } from 'react';
import Skeleton from './Skeleton';

const Dashboard = ({ onLogout }) => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // NGÀY MAI GẮN API VÀO ĐÂY
        setRecords([]); 
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleApprove = async (id) => {
    setRecords(records.map(record => 
      record.id === id ? { ...record, status: 'ĐÃ XỬ LÝ (HỢP LỆ)' } : record
    ));
    alert('Đã ghi nhận ngoại lệ hợp lệ!');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bảng Điều Khiển Quản Lý</h2>
          <p className="text-sm text-gray-500">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
        >
          Đăng xuất
        </button>
      </div>

      {/* ĐÃ CẬP NHẬT SKELETON CHO 3 THẺ THỐNG KÊ Ở ĐÂY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-medium mb-1">Tổng số sự kiện</p>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded-md animate-pulse w-16 mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-800">{records.length}</p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 font-medium mb-1">Đã xác minh (Hợp lệ)</p>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded-md animate-pulse w-16 mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-800">
              {records.filter(r => r.status && r.status.includes('HỢP LỆ')).length}
            </p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
          <p className="text-sm text-gray-500 font-medium mb-1">Cảnh báo (Cần đối soát)</p>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded-md animate-pulse w-16 mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-800">
              {records.filter(r => r.status === 'CẦN ĐỐI SOÁT').length}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">Mã NV</th>
                <th className="p-4 font-semibold">Họ và Tên</th>
                <th className="p-4 font-semibold">Thời gian</th>
                <th className="p-4 font-semibold">Sự kiện</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <Skeleton type="table" />
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <p>Chưa có dữ liệu chấm công nào trong ngày hôm nay.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-800">{record.mssv}</td>
                    <td className="p-4 text-sm text-gray-600">{record.name}</td>
                    <td className="p-4 text-sm text-gray-600">{record.time}</td>
                    <td className="p-4 text-sm">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                        {record.event}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        record.status.includes('HỢP LỆ') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {record.status === 'CẦN ĐỐI SOÁT' ? (
                        <button 
                          onClick={() => handleApprove(record.id)}
                          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          Duyệt lý do
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;