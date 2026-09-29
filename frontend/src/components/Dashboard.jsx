import React, { useState, useEffect } from 'react';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('BANG_CONG');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Giả lập loading khi chuyển tab
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // ================= CÁC COMPONENT GIAO DIỆN CHO TỪNG TAB =================

  // 1. MÀN HÌNH TỔNG QUAN
  const renderTongQuan = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
          <p className="text-sm text-gray-500 font-medium mb-1">Tổng nhân sự</p>
          <p className="text-3xl font-bold text-gray-800">21</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-emerald-500">
          <p className="text-sm text-gray-500 font-medium mb-1">Tỷ lệ đi làm đúng giờ (Tháng)</p>
          <p className="text-3xl font-bold text-gray-800">92%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-orange-500">
          <p className="text-sm text-gray-500 font-medium mb-1">Cảnh báo đi muộn</p>
          <p className="text-3xl font-bold text-gray-800">3</p>
        </div>
      </div>
      
      {/* Biểu đồ giả lập */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Biểu đồ điểm danh 7 ngày qua</h3>
        <div className="h-64 flex items-end gap-4 justify-between px-4">
          {[80, 95, 90, 100, 85, 40, 95].map((height, i) => (
            <div key={i} className="w-full bg-blue-50 rounded-t-md relative group flex flex-col justify-end h-full">
              <div 
                className={`w-full rounded-t-md transition-all duration-1000 ${height < 50 ? 'bg-orange-400' : 'bg-blue-500'}`} 
                style={{ height: `${height}%` }}
              ></div>
              <p className="text-xs text-center mt-2 text-gray-500">T{i+2}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 2. MÀN HÌNH QUẢN LÝ NHÂN VIÊN
  const renderNhanVien = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Tìm kiếm tên, mã NV..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Thêm nhân viên
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-gray-200">
              <th className="p-4 font-semibold">Mã NV</th>
              <th className="p-4 font-semibold">Họ và Tên</th>
              <th className="p-4 font-semibold">Phòng ban</th>
              <th className="p-4 font-semibold">Dữ liệu khuôn mặt</th>
              <th className="p-4 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {['Nguyễn Văn An', 'Trần Thị Lan', 'Lê Quang Huy'].map((name, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-gray-800">NV00{i+1}</td>
                <td className="p-4 text-sm text-gray-800">{name}</td>
                <td className="p-4 text-sm text-gray-600">Phòng IT</td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium border border-green-100">Đã cập nhật</span>
                </td>
                <td className="p-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 3. MÀN HÌNH THIẾT LẬP CA LÀM
  const renderCaLam = () => (
    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Ca Hành Chính</h3>
            <p className="text-sm text-gray-500">Áp dụng: Khối văn phòng</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">Đang áp dụng</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Giờ vào ca:</span><span className="font-semibold text-gray-800">08:00</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Giờ tan ca:</span><span className="font-semibold text-gray-800">17:00</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Cho phép muộn:</span><span className="font-semibold text-gray-800">15 phút</span></div>
        </div>
      </div>
    </div>
  );

  // 4. MÀN HÌNH YÊU CẦU CHỈNH SỬA
  const renderYeuCau = () => (
    <div className="animate-fade-in space-y-4">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center text-sm shrink-0">NA</div>
          <div>
            <p className="text-sm font-bold text-gray-800">Nguyễn Văn An</p>
            <p className="text-xs text-gray-500">NV001 • Phòng Kinh doanh</p>
          </div>
        </div>
        <div className="flex flex-col flex-1 px-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-500">Thiếu giờ ra</span>
            <span className="text-xs text-gray-400">• Ngày 09/09/2026</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Lý do: Đi gặp khách hàng bên ngoài lúc 16:30, quên chấm công.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium flex items-center gap-1 transition-colors">Duyệt</button>
          <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium flex items-center gap-1 transition-colors">Từ chối</button>
        </div>
      </div>
    </div>
  );

  // ================= MAIN RETURN =================
  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/50 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8V6a2 2 0 012-2h3m10 0h3a2 2 0 012 2v2M3 16v2a2 2 0 002 2h3m10 0h3a2 2 0 002-2v-2M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">FaceAttendance</h1>
            <p className="text-[11px] text-slate-400">Hệ thống chấm công</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          {[
            { id: 'TONG_QUAN', name: 'Tổng quan', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'NHAN_VIEN', name: 'Nhân viên', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'CA_LAM', name: 'Ca làm', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'BANG_CONG', name: 'Bảng công', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'YEU_CAU', name: 'Yêu cầu chỉnh sửa', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left ${activeTab === tab.id ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-70 font-medium'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'TONG_QUAN' && 'Tổng quan hệ thống'}
              {activeTab === 'NHAN_VIEN' && 'Quản lý hồ sơ nhân viên'}
              {activeTab === 'CA_LAM' && 'Thiết lập ca làm việc'}
              {activeTab === 'BANG_CONG' && 'Bảng dữ liệu chấm công'}
              {activeTab === 'YEU_CAU' && 'Xét duyệt yêu cầu'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-l pl-6 cursor-pointer" onClick={onLogout}>
              <div className="w-9 h-9 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold shadow-sm">A</div>
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">Admin</p>
                <p className="text-[11px] text-gray-500">Quản trị hệ thống</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
               <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : (
            <>
              {activeTab === 'TONG_QUAN' && renderTongQuan()}
              {activeTab === 'NHAN_VIEN' && renderNhanVien()}
              {activeTab === 'CA_LAM' && renderCaLam()}
              {activeTab === 'YEU_CAU' && renderYeuCau()}
              
              {/* TAB BẢNG CÔNG (Cốt lõi - Giữ nguyên như cũ) */}
              {activeTab === 'BANG_CONG' && (
                <div className="animate-fade-in">
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg></div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Có mặt</p>
                        <p className="text-3xl font-bold text-gray-800">0 <span className="text-sm text-gray-400 font-normal">/ 21</span></p>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Đi muộn</p>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Cần duyệt</p>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm border-b border-gray-200">
                          <th className="p-4 font-semibold w-1/3">Nhân viên</th>
                          <th className="p-4 font-semibold">Ngày</th>
                          <th className="p-4 font-semibold">Giờ vào</th>
                          <th className="p-4 font-semibold">Giờ ra</th>
                          <th className="p-4 font-semibold">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-gray-500">Đang chờ kết nối dữ liệu từ Server API...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL THÊM NHÂN VIÊN TỪ TAB 2 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-gray-800">Tạo tài khoản nhân viên</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Họ và Tên" className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
              <input type="text" placeholder="Mã Nhân Viên" className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
              <input type="email" placeholder="Email" className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowAddModal(false)} className="w-1/2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Hủy</button>
                <button onClick={() => { alert('Lưu thành công!'); setShowAddModal(false); }} className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Lưu hồ sơ</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;