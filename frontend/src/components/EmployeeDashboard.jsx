import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('CHAM_CONG');
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Khởi tạo mảng rỗng, chờ Backend trả data về
  const [historyRecords, setHistoryRecords] = useState([]);
  const [requestRecords, setRequestRecords] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ date: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    setIsLoading(true);
    const timer = setTimeout(() => {
      // API THẬT GỌI Ở ĐÂY CHO TỪNG TAB:
      // if (activeTab === 'CHAM_CONG') { fetch lịch sử -> setHistoryRecords(data) }
      // if (activeTab === 'YEU_CAU') { fetch yêu cầu -> setRequestRecords(data) }
      setIsLoading(false);
    }, 1200); 
    return () => clearTimeout(timer);
  }, [activeTab, currentPage]);

  const handleOpenModal = (dateStr = '') => {
    setModalData({ date: dateStr, reason: '' });
    setShowModal(true);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // API POST GỬI YÊU CẦU Ở ĐÂY
    setTimeout(() => {
      setIsSubmitting(false);
      setShowModal(false);
      alert('Đã gửi yêu cầu thành công! Vui lòng chờ quản lý xét duyệt.');
      setActiveTab('YEU_CAU'); 
    }, 1000);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Thiếu giờ ra':
        return <span className="px-3 py-1 bg-red-50 text-red-500 rounded-md text-sm font-medium">{status}</span>;
      case 'Đúng giờ':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md text-sm font-medium">{status}</span>;
      case 'Đi muộn':
        return <span className="px-3 py-1 bg-orange-50 text-orange-500 rounded-md text-sm font-medium">{status}</span>;
      case 'Chờ xử lý':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm font-medium">{status}</span>;
      case 'Đã duyệt':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md text-sm font-medium">{status}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-[#111827] text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-700/50 mb-4">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">FaceAttendance</h1>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-3 mt-2">
          <button onClick={() => setActiveTab('TONG_QUAN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left ${activeTab === 'TONG_QUAN' ? 'bg-[#1e293b] text-blue-400 border-l-4 border-blue-500' : 'hover:bg-[#1e293b] opacity-80'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Tổng quan
          </button>
          <button onClick={() => setActiveTab('CHAM_CONG')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'CHAM_CONG' ? 'bg-[#1e293b] text-blue-400 border-l-4 border-blue-500 font-semibold' : 'hover:bg-[#1e293b] opacity-80 font-medium'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Chấm công của tôi
          </button>
          <button onClick={() => setActiveTab('YEU_CAU')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left ${activeTab === 'YEU_CAU' ? 'bg-[#1e293b] text-blue-400 border-l-4 border-blue-500' : 'hover:bg-[#1e293b] opacity-80'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Yêu cầu chỉnh sửa
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'CHAM_CONG' ? 'Chấm công của tôi' : activeTab === 'YEU_CAU' ? 'Yêu cầu chỉnh sửa' : 'Tổng quan'}
            </h2>
          </div>
          
          <div className="flex items-center gap-5" ref={headerRef}>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Tháng 9/2026
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            <div className="relative">
              <button onClick={() => {setShowNotiMenu(!showNotiMenu); setShowProfileMenu(false);}} className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {requestRecords.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
              
              {showNotiMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 shadow-xl rounded-xl py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-gray-50 mb-2">
                    <h4 className="font-bold text-gray-800">Thông báo mới</h4>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm text-gray-800 font-medium">Chưa có thông báo</p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200"></div>
            
            <div className="relative">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => {setShowProfileMenu(!showProfileMenu); setShowNotiMenu(false);}}>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-blue-700 transition-colors">NA</div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-sm font-bold text-gray-800">Tài khoản nhân viên</p>
                  </div>
                  <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
                    Đăng xuất khỏi hệ thống
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'CHAM_CONG' ? (
          <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
            
            {/* THỐNG KÊ ĐỘNG TỪ API */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#f0fdf4] p-6 rounded-2xl flex items-center gap-5 border border-emerald-50">
                <div className="w-12 h-12 rounded-xl bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-sm"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg></div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Ngày công</p>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? <div className="h-8 w-12 bg-emerald-200/50 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{historyRecords.length}</p>}
                    <span className="text-sm text-gray-500">/ 26 ngày</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#fff7ed] p-6 rounded-2xl flex items-center gap-5 border border-orange-50">
                <div className="w-14 h-14 rounded-xl bg-[#f97316] flex items-center justify-center text-white shrink-0 shadow-sm"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Đi muộn</p>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? <div className="h-8 w-10 bg-orange-200/50 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{historyRecords.filter(r => r.status === 'Đi muộn').length}</p>}
                    <span className="text-sm text-gray-500">trong tháng</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#eff6ff] p-6 rounded-2xl flex items-center gap-5 border border-blue-50">
                <div className="w-14 h-14 rounded-xl bg-[#3b82f6] flex items-center justify-center text-white shrink-0 shadow-sm"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Chờ xử lý</p>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? <div className="h-8 w-10 bg-blue-200/50 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{requestRecords.filter(r => r.status === 'Chờ xử lý').length}</p>}
                    <span className="text-sm text-gray-500">yêu cầu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG DỮ LIỆU ĐỘNG */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-100">
                    <th className="p-4 font-semibold w-1/5">Ngày</th>
                    <th className="p-4 font-semibold w-1/5">Giờ vào</th>
                    <th className="p-4 font-semibold w-1/5">Giờ ra</th>
                    <th className="p-4 font-semibold w-1/5">Trạng thái</th>
                    <th className="p-4 font-semibold w-1/5">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    [...Array(4)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="p-4"><div className="h-5 bg-gray-200 rounded w-24"></div></td>
                        <td className="p-4"><div className="h-5 bg-gray-200 rounded w-16"></div></td>
                        <td className="p-4"><div className="h-5 bg-gray-200 rounded w-16"></div></td>
                        <td className="p-4"><div className="h-7 bg-gray-200 rounded-md w-20"></div></td>
                        <td className="p-4"><div className="h-8 bg-gray-200 rounded-md w-28"></div></td>
                      </tr>
                    ))
                  ) : historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-500">Chưa có lịch sử chấm công</td>
                    </tr>
                  ) : (
                    historyRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="p-4 text-sm text-gray-700 font-medium">{record.date}</td>
                        <td className="p-4 text-sm text-gray-600">{record.timeIn}</td>
                        <td className="p-4 text-sm text-gray-600">{record.timeOut}</td>
                        <td className="p-4">{renderStatusBadge(record.status)}</td>
                        <td className="p-4">
                          {record.status === 'Thiếu giờ ra' && (
                            <button onClick={() => handleOpenModal(record.date)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 flex items-center gap-1.5 active:scale-95">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                              Báo sai sót
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-[#f0f9ff] rounded-2xl p-6 flex justify-between items-center border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></div>
                <div>
                  <h4 className="text-base font-bold text-gray-800">Gửi yêu cầu chỉnh sửa chấm công</h4>
                  <p className="text-sm text-gray-500">Gửi yêu cầu để quản lý xem xét nếu có sai sót.</p>
                </div>
              </div>
              <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                Gửi yêu cầu chỉnh sửa
              </button>
            </div>

          </div>
        ) : activeTab === 'YEU_CAU' ? (
          
          <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Lịch sử gửi yêu cầu</h3>
              <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Tạo yêu cầu mới
              </button>
            </div>

            {/* BẢNG YÊU CẦU ĐỘNG TỪ API */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-100">
                    <th className="p-4 font-semibold w-1/5">Thời gian gửi</th>
                    <th className="p-4 font-semibold w-1/5">Ngày cần sửa</th>
                    <th className="p-4 font-semibold w-2/5">Lý do chi tiết</th>
                    <th className="p-4 font-semibold w-1/5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    [...Array(2)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="p-4"><div className="h-5 bg-gray-200 rounded w-32"></div></td>
                        <td className="p-4"><div className="h-5 bg-gray-200 rounded w-24"></div></td>
                        <td className="p-4"><div className="h-5 bg-gray-200 rounded w-full"></div></td>
                        <td className="p-4"><div className="h-7 bg-gray-200 rounded-md w-20"></div></td>
                      </tr>
                    ))
                  ) : requestRecords.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Bạn chưa gửi yêu cầu nào.</td></tr>
                  ) : (
                    requestRecords.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm text-gray-500">{req.submitTime}</td>
                        <td className="p-4 text-sm text-gray-800 font-medium">{req.dateTarget}</td>
                        <td className="p-4 text-sm text-gray-600">{req.reason}</td>
                        <td className="p-4">{renderStatusBadge(req.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center justify-center py-20 px-10 bg-white rounded-2xl border border-gray-100 border-dashed w-full max-w-3xl">
              <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <h3 className="text-xl font-bold text-gray-600 mb-2">Tính năng đang cập nhật</h3>
              <button onClick={() => setActiveTab('CHAM_CONG')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Quay lại màn hình chính
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP YÊU CẦU CHỈNH SỬA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h3 className="text-lg font-bold text-gray-800">
                {modalData.date ? 'Báo sai sót chấm công' : 'Gửi yêu cầu chỉnh sửa'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày cần chỉnh sửa</label>
                  <input type="text" required value={modalData.date} onChange={(e) => setModalData({...modalData, date: e.target.value})} placeholder="VD: 09/09/2026" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lý do chi tiết</label>
                  <textarea required rows="3" value={modalData.reason} onChange={(e) => setModalData({...modalData, reason: e.target.value})} placeholder="Nhập lý do quên chấm công..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex justify-center items-center gap-2">
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDashboard;