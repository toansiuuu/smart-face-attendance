import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState([]); 
  const [activeTab, setActiveTab] = useState('BANG_CONG');

  // State quản lý Dropdown ở Header
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Xử lý click ra ngoài để đóng Dropdown
  const headerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotiMenu(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTab === 'BANG_CONG') {
      const fetchRecords = async () => {
        setIsLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); 
          // API THẬT SẼ ĐƯỢC GỌI Ở ĐÂY:
          setRecords([]); 
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRecords();
    }
  }, [activeTab]);

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
            <p className="text-[11px] text-slate-400">Hệ thống quản trị</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          <button onClick={() => setActiveTab('TONG_QUAN')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'TONG_QUAN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500' : 'hover:bg-slate-800 opacity-70'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Tổng quan
          </button>
          <button onClick={() => setActiveTab('NHAN_VIEN')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'NHAN_VIEN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500' : 'hover:bg-slate-800 opacity-70'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Nhân viên
          </button>
          <button onClick={() => setActiveTab('CA_LAM')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'CA_LAM' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500' : 'hover:bg-slate-800 opacity-70'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Ca làm
          </button>
          <button onClick={() => setActiveTab('BANG_CONG')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'BANG_CONG' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-70'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Bảng công
          </button>
          <button onClick={() => setActiveTab('YEU_CAU')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'YEU_CAU' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500' : 'hover:bg-slate-800 opacity-70'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Yêu cầu chờ duyệt
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'TONG_QUAN' && 'Tổng quan hệ thống'}
              {activeTab === 'NHAN_VIEN' && 'Quản lý nhân viên'}
              {activeTab === 'CA_LAM' && 'Thiết lập ca làm'}
              {activeTab === 'BANG_CONG' && 'Quản lý chấm công'}
              {activeTab === 'YEU_CAU' && 'Yêu cầu chờ duyệt'}
            </h2>
          </div>
          
          {/* HEADER KẾT HỢP DROPDOWN MỚI */}
          <div className="flex items-center gap-5" ref={headerRef}>
            
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Tháng 9/2026
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {/* CHUÔNG THÔNG BÁO */}
            <div className="relative">
              <button 
                onClick={() => {setShowNotiMenu(!showNotiMenu); setShowProfileMenu(false);}} 
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {/* Giả lập có thông báo */}
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              {showNotiMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-xl py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-gray-50 mb-2 flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">Thông báo mới</h4>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => {setActiveTab('YEU_CAU'); setShowNotiMenu(false);}}>Xem tất cả</span>
                  </div>
                  <div 
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {setActiveTab('YEU_CAU'); setShowNotiMenu(false);}}
                  >
                    <p className="text-sm text-gray-800 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Yêu cầu chỉnh sửa mới
                    </p>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">Nhân viên Nguyễn Văn An (NV001) vừa gửi một yêu cầu báo sai sót chấm công ngày hôm nay.</p>
                    <p className="text-xs text-blue-500 mt-2 font-medium">Vừa xong</p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* AVATAR & DROPDOWN ĐĂNG XUẤT */}
            <div className="relative">
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => {setShowProfileMenu(!showProfileMenu); setShowNotiMenu(false);}}
              >
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-[#172554] transition-colors">
                  A
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">Admin</p>
                  <p className="text-[11px] text-gray-500">Quản trị hệ thống</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-slate-50 rounded-t-xl">
                    <p className="text-sm font-bold text-gray-800">Tài khoản Admin</p>
                    <p className="text-xs text-gray-500">Hệ thống trung tâm</p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'BANG_CONG' ? (
            <>
              {/* THỐNG KÊ */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Tổng số dữ liệu</p>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-bold text-gray-800">{records.length}</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Đi muộn</p>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-bold text-gray-800">{records.filter(r => r.status === 'Đi muộn').length}</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Cần duyệt</p>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-bold text-gray-800">{records.filter(r => r.status === 'Thiếu giờ ra').length}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* BẢNG DỮ LIỆU */}
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
                    {isLoading ? (
                      [...Array(3)].map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="p-4"><div className="h-10 bg-gray-200 rounded w-full"></div></td>
                          <td className="p-4"><div className="h-4 bg-gray-200 w-20 rounded"></div></td>
                          <td className="p-4"><div className="h-4 bg-gray-200 w-12 rounded"></div></td>
                          <td className="p-4"><div className="h-4 bg-gray-200 w-12 rounded"></div></td>
                          <td className="p-4"><div className="h-6 bg-gray-200 w-20 rounded-md"></div></td>
                        </tr>
                      ))
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-gray-500">Chưa có dữ liệu từ Server API</td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="p-4">{record.name}</td>
                          <td className="p-4 text-sm text-gray-600">{record.date}</td>
                          <td className="p-4 text-sm font-medium">{record.timeIn}</td>
                          <td className="p-4 text-sm font-medium">{record.timeOut}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                              record.status === 'Thiếu giờ ra' ? 'bg-red-50 text-red-500' :
                              record.status === 'Đúng giờ' ? 'bg-emerald-50 text-emerald-600' :
                              record.status === 'Đi muộn' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
              <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <h3 className="text-xl font-bold text-gray-600 mb-2">Tính năng đang trong giai đoạn phát triển</h3>
              <p className="text-gray-400 text-sm max-w-md text-center">Module này thuộc giai đoạn 2 của dự án. Trong bản demo MVP, vui lòng kiểm thử tính năng chính tại tab Bảng công.</p>
              <button onClick={() => setActiveTab('BANG_CONG')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Quay lại Bảng công
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;