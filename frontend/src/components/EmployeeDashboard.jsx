import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('TONG_QUAN');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedMonth, setSelectedMonth] = useState('9/2026');
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modal State cho Form Gửi Yêu Cầu mới
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ 
    date: '', 
    scanType: 'Giờ ra (Chiều)', 
    currentRecord: '— (Trống)', 
    requestedTime: '', 
    reason: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotiMenu(false); setShowProfileMenu(false); setShowMonthMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800); 
    return () => clearTimeout(timer);
  }, [activeTab, currentPage, selectedMonth]);

  const mockHistory = [
    { id: 1, date: '29/09/2026', timeIn: '08:02', timeOut: '-', status: 'Thiếu giờ ra' },
    { id: 2, date: '28/09/2026', timeIn: '07:58', timeOut: '17:03', status: 'Đúng giờ' },
    { id: 3, date: '27/09/2026', timeIn: '08:10', timeOut: '17:00', status: 'Đi muộn' },
    { id: 4, date: '26/09/2026', timeIn: '07:56', timeOut: '17:02', status: 'Đúng giờ' },
    { id: 5, date: '25/09/2026', timeIn: '07:59', timeOut: '17:01', status: 'Đúng giờ' },
    { id: 6, date: '24/09/2026', timeIn: '08:01', timeOut: '17:05', status: 'Đúng giờ' },
  ];

  const mockRequests = [
    { id: 1, submitTime: '10:30 - 29/09/2026', dateTarget: '29/09/2026', reason: 'Quên chấm công lúc về do đi gặp khách hàng.', status: 'Chờ xử lý' },
    { id: 2, submitTime: '08:15 - 15/09/2026', dateTarget: '14/09/2026', reason: 'Hệ thống camera không nhận diện được.', status: 'Đã duyệt' },
  ];

  // Hàm tính toán phân trang
  const currentHistory = mockHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(mockHistory.length / itemsPerPage) || 1;

  const handleOpenModal = (dateStr = '') => {
    // Chuyển format DD/MM/YYYY thành YYYY-MM-DD để nhét vào thẻ <input type="date">
    let formattedDate = '';
    if (dateStr) {
      const [d, m, y] = dateStr.split('/');
      formattedDate = `${y}-${m}-${d}`;
    }
    setModalData({ 
      date: formattedDate, 
      scanType: 'Giờ ra (Chiều)', 
      currentRecord: '— (Trống)', 
      requestedTime: '', 
      reason: '' 
    });
    setShowModal(true);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowModal(false);
      alert('Đã gửi yêu cầu thành công! Vui lòng chờ quản lý xét duyệt.');
      setActiveTab('YEU_CAU'); 
    }, 1000);
  };

  const renderStatusBadge = (status) => {
    const baseClass = "px-3 py-1.5 rounded-md text-[13px] font-bold inline-block text-center w-[110px] whitespace-nowrap shadow-sm";
    switch (status) {
      case 'Thiếu giờ ra':
      case 'Chờ xử lý': return <span className={`${baseClass} bg-red-50 text-red-500 border border-red-100`}>{status}</span>;
      case 'Đúng giờ':
      case 'Đã duyệt': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}>{status}</span>;
      case 'Đi muộn': return <span className={`${baseClass} bg-orange-50 text-orange-500 border border-orange-100`}>{status}</span>;
      default: return <span className={`${baseClass} bg-gray-50 text-gray-600 border border-gray-200`}>{status}</span>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-[#111827] text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-700/50 mb-4">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <div><h1 className="text-white font-bold text-sm tracking-wide">FaceAttendance</h1></div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-3 mt-2">
          <button onClick={() => setActiveTab('TONG_QUAN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'TONG_QUAN' ? 'bg-[#1e293b] text-blue-400 border-l-4 border-blue-500 font-semibold' : 'hover:bg-[#1e293b] opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>Tổng quan</button>
          <button onClick={() => setActiveTab('CHAM_CONG')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'CHAM_CONG' ? 'bg-[#1e293b] text-blue-400 border-l-4 border-blue-500 font-semibold' : 'hover:bg-[#1e293b] opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>Chấm công của tôi</button>
          <button onClick={() => setActiveTab('YEU_CAU')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'YEU_CAU' ? 'bg-[#1e293b] text-blue-400 border-l-4 border-blue-500 font-semibold' : 'hover:bg-[#1e293b] opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>Yêu cầu chỉnh sửa</button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shrink-0 sticky top-0 z-10">
          <div><h2 className="text-2xl font-bold text-gray-800">{activeTab === 'TONG_QUAN' ? 'Tổng quan' : activeTab === 'CHAM_CONG' ? 'Chấm công của tôi' : 'Yêu cầu chỉnh sửa'}</h2></div>
          <div className="flex items-center gap-5" ref={headerRef}>
            <div className="relative">
              <button onClick={() => {setShowMonthMenu(!showMonthMenu); setShowNotiMenu(false); setShowProfileMenu(false);}} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>Tháng {selectedMonth}</button>
              {showMonthMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  {['9/2026', '8/2026', '7/2026'].map((month) => (
                    <button key={month} onClick={() => {setSelectedMonth(month); setShowMonthMenu(false);}} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 flex items-center justify-between ${selectedMonth === month ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-700 font-medium'}`}>Tháng {month}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowNotiMenu(!showNotiMenu)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></button>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="relative">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">NA</div>
              </div>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: TỔNG QUAN (GIỮ NGUYÊN) */}
          {activeTab === 'TONG_QUAN' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
                <div className="bg-[#f0fdf4] p-6 rounded-2xl flex items-center gap-5 border border-emerald-50"><div className="w-12 h-12 rounded-xl bg-[#10b981] flex items-center justify-center text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg></div><div><p className="text-sm text-gray-600 font-medium mb-1">Ngày công</p><div className="flex items-baseline gap-2">{isLoading ? <div className="h-8 w-12 bg-emerald-200/50 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{mockHistory.length}</p>}<span className="text-sm text-gray-500">/ 26 ngày</span></div></div></div>
                <div className="bg-[#fff7ed] p-6 rounded-2xl flex items-center gap-5 border border-orange-50"><div className="w-14 h-14 rounded-xl bg-[#f97316] flex items-center justify-center text-white"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div><p className="text-sm text-gray-600 font-medium mb-1">Đi muộn</p><div className="flex items-baseline gap-2">{isLoading ? <div className="h-8 w-10 bg-orange-200/50 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{mockHistory.filter(r => r.status === 'Đi muộn').length}</p>}<span className="text-sm text-gray-500">trong tháng</span></div></div></div>
                <div className="bg-[#eff6ff] p-6 rounded-2xl flex items-center gap-5 border border-blue-50"><div className="w-14 h-14 rounded-xl bg-[#3b82f6] flex items-center justify-center text-white"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><div><p className="text-sm text-gray-600 font-medium mb-1">Chờ xử lý</p><div className="flex items-baseline gap-2">{isLoading ? <div className="h-8 w-10 bg-blue-200/50 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{mockRequests.length}</p>}<span className="text-sm text-gray-500">yêu cầu</span></div></div></div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Bảng công hôm nay</h3><span className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={()=>setActiveTab('CHAM_CONG')}>Xem tất cả</span></div>
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-100"><th className="p-4 font-semibold w-1/4">Ngày</th><th className="p-4 font-semibold w-1/4 text-center">Giờ vào</th><th className="p-4 font-semibold w-1/4 text-center">Giờ ra</th><th className="p-4 font-semibold w-1/4 text-center">Trạng thái</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {mockHistory.slice(0,3).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50"><td className="p-4 text-sm text-gray-700 font-medium">{record.date}</td><td className="p-4 text-sm text-gray-800 font-medium text-center">{record.timeIn}</td><td className="p-4 text-sm text-gray-800 font-medium text-center">{record.timeOut}</td><td className="p-4 text-center">{renderStatusBadge(record.status)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-[#f0f9ff] rounded-2xl p-6 flex justify-between items-center border border-blue-100 animate-fade-in">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></div><div><h4 className="text-base font-bold text-gray-800">Gửi yêu cầu chỉnh sửa chấm công</h4><p className="text-sm text-gray-500 mt-0.5">Gửi yêu cầu để quản lý xem xét nếu có sai sót.</p></div></div>
                <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-[#0891b2] hover:bg-[#0e7490] text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors active:scale-95 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>Gửi yêu cầu chỉnh sửa</button>
              </div>
            </div>
          )}

          {/* TAB 2: CHẤM CÔNG CỦA TÔI (GIỮ NGUYÊN) */}
          {activeTab === 'CHAM_CONG' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in mb-8">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-100"><th className="p-4 font-semibold w-1/5">Ngày</th><th className="p-4 font-semibold w-1/5 text-center">Giờ vào</th><th className="p-4 font-semibold w-1/5 text-center">Giờ ra</th><th className="p-4 font-semibold w-1/5 text-center">Trạng thái</th><th className="p-4 font-semibold w-1/5 text-center">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {currentHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-gray-700 font-medium">{record.date}</td><td className="p-4 text-sm text-gray-800 font-medium text-center">{record.timeIn}</td><td className="p-4 text-sm text-gray-800 font-medium text-center">{record.timeOut}</td><td className="p-4 text-center">{renderStatusBadge(record.status)}</td>
                      <td className="p-4 flex justify-center">
                        {record.status === 'Thiếu giờ ra' || record.status === 'Đi muộn' ? (
                          <button onClick={() => handleOpenModal(record.date)} className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 flex items-center gap-1.5 active:scale-95 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> Báo sai sót</button>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white">
                <span className="text-sm text-gray-500 font-medium">Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, mockHistory.length)} của {mockHistory.length} ngày</span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'<'}</button>
                  {[...Array(totalPages)].map((_, i) => <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i + 1}</button>)}
                  <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'>'}</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: YÊU CẦU CHỈNH SỬA (GIỮ NGUYÊN) */}
          {activeTab === 'YEU_CAU' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-gray-100 bg-white"><h3 className="font-bold text-gray-800 text-lg">Danh sách yêu cầu đã gửi</h3></div>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-100"><th className="p-4 font-semibold w-1/4">Thời gian gửi</th><th className="p-4 font-semibold w-1/5">Ngày cần sửa</th><th className="p-4 font-semibold w-2/5">Lý do chi tiết</th><th className="p-4 font-semibold w-1/5 text-center">Trạng thái</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {mockRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-gray-500">{req.submitTime}</td><td className="p-4 text-sm text-gray-800 font-medium">{req.dateTarget}</td><td className="p-4 text-sm text-gray-600">{req.reason}</td><td className="p-4 text-center">{renderStatusBadge(req.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL GỬI YÊU CẦU MỚI (CHUẨN FORM HÌNH 3 - 2 CỘT) ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">Tạo yêu cầu chỉnh sửa</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="p-6 overflow-y-auto">
              <div className="space-y-5">
                {/* Hàng 1: Ngày chấm công & Loại chấm công */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày chấm công</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={modalData.date} 
                        onChange={(e) => setModalData({...modalData, date: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-700 font-medium" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại chấm công</label>
                    <select 
                      value={modalData.scanType} 
                      onChange={(e) => setModalData({...modalData, scanType: e.target.value})} 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-700 font-medium"
                    >
                      <option>Giờ vào (Sáng)</option>
                      <option>Giờ ra (Trưa)</option>
                      <option>Giờ vào (Chiều)</option>
                      <option>Giờ ra (Chiều)</option>
                    </select>
                  </div>
                </div>

                {/* Hàng 2: Dữ liệu hiện tại & Giờ đề xuất */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dữ liệu hiện tại</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={modalData.currentRecord} 
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none text-sm text-gray-500 cursor-not-allowed font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giờ đề xuất</label>
                    <input 
                      type="time" 
                      value={modalData.requestedTime} 
                      onChange={(e) => setModalData({...modalData, requestedTime: e.target.value})} 
                      required 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-700 font-bold text-center" 
                    />
                  </div>
                </div>

                {/* Hàng 3: Lý do */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lý do</label>
                  <textarea 
                    required 
                    rows="3" 
                    value={modalData.reason} 
                    onChange={(e) => setModalData({...modalData, reason: e.target.value})} 
                    placeholder="VD: Tôi đã quét khuôn mặt cuối ca nhưng hệ thống không ghi nhận..." 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none text-gray-700"
                  ></textarea>
                </div>

                {/* Hàng 4: Upload Tệp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tệp đính kèm (Tùy chọn)</label>
                  <input 
                    type="file" 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors border border-gray-200 rounded-xl bg-gray-50 cursor-pointer" 
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-colors">
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