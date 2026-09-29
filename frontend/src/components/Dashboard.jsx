import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('TONG_QUAN');
  const [isLoading, setIsLoading] = useState(true);
  
  // State Phân trang dùng chung
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Bộ lọc tháng Header
  const [selectedMonth, setSelectedMonth] = useState('9/2026');
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  // Dropdown Menu State Header
  const [showNotiMenu, setShowNotiMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // State Modal Thêm Nhân Viên
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  // ================= THÊM STATE TÌM KIẾM & LỌC =================
  // Cho tab Nhân viên
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('Tất cả phòng ban');

  // Cho tab Bảng công
  const [attSearchTerm, setAttSearchTerm] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('Tất cả trạng thái');
  // State Lọc Ngày (Mặc định 2026-09-09 để khớp với mock data)
  const [attDateFilter, setAttDateFilter] = useState('2026-09-09');

  const headerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowNotiMenu(false);
        setShowProfileMenu(false);
        setShowMonthMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset trang về 1 khi đổi tab hoặc đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, empSearchTerm, empDeptFilter, attSearchTerm, attStatusFilter, attDateFilter]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800); 
    return () => clearTimeout(timer);
  }, [activeTab, selectedMonth]);

  // ================= MOCK DATA =================
  const mockEmployees = [
    { id: 1, avatar: 'NA', name: 'Nguyễn Văn An', empId: 'NV001', dept: 'Phòng Kinh doanh', phone: '0901234567', hasFaceData: true },
    { id: 2, avatar: 'TL', name: 'Trần Thị Lan', empId: 'NV002', dept: 'Phòng Kế toán', phone: '0912345678', hasFaceData: true },
    { id: 3, avatar: 'LQ', name: 'Lê Quang Huy', empId: 'NV003', dept: 'Phòng Kỹ thuật', phone: '0987654321', hasFaceData: false },
    { id: 4, avatar: 'PT', name: 'Phạm Thu Hà', empId: 'NV004', dept: 'Phòng Nhân sự', phone: '0933445566', hasFaceData: true },
    { id: 5, avatar: 'ĐT', name: 'Đỗ Thành Nam', empId: 'NV005', dept: 'Phòng Kinh doanh', phone: '0909887766', hasFaceData: true },
    { id: 6, avatar: 'MH', name: 'Mai Thu Huyền', empId: 'NV006', dept: 'Phòng Kế toán', phone: '0988112233', hasFaceData: true },
  ];

  const mockRecords = [
    { id: 1, avatar: 'NA', name: 'Nguyễn Văn An', empId: 'NV001', dept: 'Phòng Kinh doanh', date: '09/09/2026', timeIn: '08:02', timeOut: '-', status: 'Thiếu giờ ra' },
    { id: 2, avatar: 'TL', name: 'Trần Thị Lan', empId: 'NV002', dept: 'Phòng Kế toán', date: '09/09/2026', timeIn: '07:58', timeOut: '17:02', status: 'Đúng giờ' },
    { id: 3, avatar: 'LQ', name: 'Lê Quang Huy', empId: 'NV003', dept: 'Phòng Kỹ thuật', date: '09/09/2026', timeIn: '08:15', timeOut: '17:00', status: 'Đi muộn' },
    { id: 4, avatar: 'PT', name: 'Phạm Thu Hà', empId: 'NV004', dept: 'Phòng Nhân sự', date: '09/09/2026', timeIn: '07:55', timeOut: '16:58', status: 'Đúng giờ' },
    { id: 5, avatar: 'ĐT', name: 'Đỗ Thành Nam', empId: 'NV005', dept: 'Phòng Kinh doanh', date: '09/09/2026', timeIn: '08:01', timeOut: '17:05', status: 'Đúng giờ' },
    { id: 6, avatar: 'MH', name: 'Mai Thu Huyền', empId: 'NV006', dept: 'Phòng Kế toán', date: '09/09/2026', timeIn: '08:10', timeOut: '17:00', status: 'Đi muộn' },
  ];

  const mockRequests = [
    { id: 1, name: 'Nguyễn Văn An', empId: 'NV001', dateTarget: '29/09/2026', reason: 'Quên chấm công lúc về do đi gặp khách hàng.', time: '1 giờ trước', status: 'Chờ duyệt' },
    { id: 2, name: 'Lê Quang Huy', empId: 'NV003', dateTarget: '28/09/2026', reason: 'Hệ thống camera không nhận diện được lúc vào.', time: '2 giờ trước', status: 'Chờ duyệt' },
  ];

  // ================= LOGIC XỬ LÝ LỌC & PHÂN TRANG =================
  const filteredEmployees = mockEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(empSearchTerm.toLowerCase()) || 
                          emp.empId.toLowerCase().includes(empSearchTerm.toLowerCase()) ||
                          emp.phone.includes(empSearchTerm);
    const matchesDept = empDeptFilter === 'Tất cả phòng ban' || emp.dept === empDeptFilter;
    return matchesSearch && matchesDept;
  });
  const totalEmpPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredRecords = mockRecords.filter(rec => {
    // 1. Lọc theo tìm kiếm
    const matchesSearch = rec.name.toLowerCase().includes(attSearchTerm.toLowerCase()) || 
                          rec.empId.toLowerCase().includes(attSearchTerm.toLowerCase());
    
    // 2. Lọc theo trạng thái
    const matchesStatus = attStatusFilter === 'Tất cả trạng thái' || rec.status === attStatusFilter;
    
    // 3. Lọc theo ngày (Chuyển đổi định dạng YYYY-MM-DD của input date sang DD/MM/YYYY của mock data)
    let matchesDate = true;
    if (attDateFilter) {
      const [year, month, day] = attDateFilter.split('-');
      const formattedInputDate = `${day}/${month}/${year}`;
      matchesDate = rec.date === formattedInputDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });
  const totalAttPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;

  // ================= CÁC HÀM XỬ LÝ SỰ KIỆN =================
  const handleAction = (action, name) => alert(`Đã ${action} yêu cầu của nhân viên: ${name}`);
  const handleEditEmp = (name) => alert(`Mở form chỉnh sửa thông tin cho: ${name}`);
  
  const handleAddEmployee = (e) => {
    e.preventDefault();
    setIsSubmittingEmp(true);
    setTimeout(() => {
      setIsSubmittingEmp(false);
      setShowAddEmpModal(false);
      alert('Thêm nhân viên và tạo mã nhận diện thành công!');
    }, 1000);
  };

  const renderStatusBadge = (status) => {
    const baseClass = "px-3 py-1.5 rounded-md text-[13px] font-bold inline-block text-center w-[110px] whitespace-nowrap shadow-sm";
    switch (status) {
      case 'Thiếu giờ ra':
      case 'Chờ duyệt':
        return <span className={`${baseClass} bg-red-50 text-red-500 border border-red-100`}>{status}</span>;
      case 'Đúng giờ':
        return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}>{status}</span>;
      case 'Đi muộn':
        return <span className={`${baseClass} bg-orange-50 text-orange-500 border border-orange-100`}>{status}</span>;
      default:
        return <span className={`${baseClass} bg-gray-50 text-gray-600 border border-gray-200`}>{status}</span>;
    }
  };

  // ================= CÁC KHỐI COMPONENT GIAO DIỆN =================
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Tổng số dữ liệu</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-bold text-gray-800">{mockRecords.length}</p>}
            <span className="text-sm text-gray-400">/ {mockEmployees.length} nhân viên</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Đi muộn</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-bold text-gray-800">{mockRecords.filter(r => r.status === 'Đi muộn').length}</p>}
            <span className="text-sm text-gray-400">hôm nay</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Cần duyệt</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-bold text-gray-800">{mockRequests.length}</p>}
            <span className="text-sm text-gray-400">yêu cầu</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTable = (isFullTable) => {
    const currentRecords = isFullTable 
      ? filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : filteredRecords.slice(0, 3);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 animate-fade-in">
        {activeTab === 'TONG_QUAN' && (
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-gray-800 text-lg">Bảng công hôm nay</h3>
            <span className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setActiveTab('BANG_CONG')}>Xem tất cả</span>
          </div>
        )}

        {isFullTable && (
          <div className="p-5 border-b border-gray-100 bg-white">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Bảng công nhân viên</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input 
                  type="text" 
                  value={attSearchTerm}
                  onChange={(e) => setAttSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm mã NV, tên..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" 
                />
              </div>
              <div className="flex gap-4">
                {/* LỌC NGÀY CHUẨN THIẾT KẾ MỚI */}
                <input 
                  type="date"
                  value={attDateFilter}
                  onChange={(e) => setAttDateFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 transition-colors cursor-pointer min-w-[160px]"
                />
                
                <select 
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 transition-colors min-w-[160px] cursor-pointer"
                >
                  <option value="Tất cả trạng thái">Tất cả trạng thái</option>
                  <option value="Đúng giờ">Đúng giờ</option>
                  <option value="Đi muộn">Đi muộn</option>
                  <option value="Thiếu giờ ra">Thiếu giờ ra</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-slate-500 text-sm border-b border-gray-100">
              <th className="p-4 font-semibold w-1/4">Nhân viên</th>
              <th className="p-4 font-semibold w-1/5">Ngày</th>
              <th className="p-4 font-semibold w-1/5 text-center">Giờ vào</th>
              <th className="p-4 font-semibold w-1/5 text-center">Giờ ra</th>
              <th className="p-4 font-semibold w-1/5 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(isFullTable ? 5 : 3)].map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="p-4 flex gap-3"><div className="w-8 h-8 bg-gray-200 rounded-full"></div><div className="h-5 bg-gray-200 rounded w-24 mt-1"></div></td>
                  <td className="p-4"><div className="h-5 bg-gray-200 rounded w-20"></div></td>
                  <td className="p-4"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td>
                  <td className="p-4"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td>
                  <td className="p-4 flex justify-center"><div className="h-7 bg-gray-200 rounded-md w-[110px]"></div></td>
                </tr>
              ))
            ) : currentRecords.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-gray-500">Không tìm thấy dữ liệu chấm công phù hợp.</td></tr>
            ) : (
              currentRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 border border-blue-100">{record.avatar}</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{record.name}</p>
                        <p className="text-[11px] text-gray-500">{record.empId} • {record.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{record.date}</td>
                  <td className="p-4 text-sm text-gray-800 font-medium text-center">{record.timeIn}</td>
                  <td className="p-4 text-sm text-gray-800 font-medium text-center">{record.timeOut}</td>
                  <td className="p-4 text-center">{renderStatusBadge(record.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isFullTable && filteredRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white">
            <span className="text-sm text-gray-500">Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} của {filteredRecords.length} dữ liệu</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'<'}</button>
              {[...Array(totalAttPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(totalAttPages, prev + 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'>'}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRequestsTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in mb-8">
      {activeTab === 'TONG_QUAN' && (
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <div><h3 className="font-bold text-gray-800 text-lg">Yêu cầu chờ duyệt</h3></div>
          <span className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => setActiveTab('YEU_CAU')}>Xem tất cả</span>
        </div>
      )}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f8fafc] text-slate-500 text-sm border-b border-gray-100">
            <th className="p-4 font-semibold w-1/4">Nhân viên</th><th className="p-4 font-semibold w-1/5">Ngày cần sửa</th><th className="p-4 font-semibold w-1/3">Lý do chi tiết</th><th className="p-4 font-semibold w-1/4 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {isLoading ? (
            [...Array(2)].map((_, idx) => <tr key={idx} className="animate-pulse"><td className="p-4 flex gap-3"><div className="w-8 h-8 bg-gray-200 rounded-full"></div><div className="h-5 bg-gray-200 rounded w-24 mt-1"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-24"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-full"></div></td><td className="p-4"><div className="h-8 bg-gray-200 rounded-md w-full max-w-[120px] mx-auto"></div></td></tr>)
          ) : mockRequests.length === 0 ? (
            <tr><td colSpan="4" className="p-8 text-center text-gray-500">Không có yêu cầu nào cần duyệt.</td></tr>
          ) : (
            mockRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-orange-100 text-orange-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0">{req.name.charAt(0)}</div><div><p className="text-sm font-bold text-gray-800">{req.name}</p><p className="text-[11px] text-gray-500">{req.empId} • {req.time}</p></div></div></td>
                <td className="p-4 text-sm text-gray-800 font-medium">{req.dateTarget} <br/><div className="mt-1">{renderStatusBadge(req.status)}</div></td>
                <td className="p-4 text-sm text-gray-600 leading-relaxed">{req.reason}</td>
                <td className="p-4"><div className="flex items-center justify-center gap-2"><button onClick={() => handleAction('Duyệt', req.name)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Duyệt</button><button onClick={() => handleAction('Từ chối', req.name)} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium transition-colors active:scale-95">Từ chối</button></div></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderEmployeesTable = () => (
    <div className="mb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Quản lý hồ sơ nhân viên</h3>
        <button onClick={() => setShowAddEmpModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>Thêm nhân viên
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" value={empSearchTerm} onChange={(e) => setEmpSearchTerm(e.target.value)} placeholder="Tìm kiếm theo Tên, Mã NV, Số điện thoại..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
        </div>
        <select value={empDeptFilter} onChange={(e) => setEmpDeptFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 transition-colors min-w-[180px] cursor-pointer">
          <option value="Tất cả phòng ban">Tất cả phòng ban</option>
          <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
          <option value="Phòng Kế toán">Phòng Kế toán</option>
          <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
          <option value="Phòng Nhân sự">Phòng Nhân sự</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-200"><th className="p-4 font-semibold w-1/3">Nhân viên</th><th className="p-4 font-semibold w-1/5">Số điện thoại</th><th className="p-4 font-semibold w-1/4">Dữ liệu khuôn mặt</th><th className="p-4 font-semibold w-1/6 text-center">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, idx) => <tr key={idx} className="animate-pulse"><td className="p-4 flex gap-3 items-center"><div className="w-10 h-10 bg-gray-200 rounded-full"></div><div><div className="h-4 bg-gray-200 rounded w-24 mb-1.5"></div><div className="h-3 bg-gray-200 rounded w-32"></div></div></td><td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td><td className="p-4"><div className="h-6 bg-gray-200 rounded-md w-28"></div></td><td className="p-4"><div className="h-8 bg-gray-200 rounded-md w-16 mx-auto"></div></td></tr>)
            ) : currentEmployees.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Không tìm thấy nhân viên phù hợp.</td></tr>
            ) : (
              currentEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 border border-blue-100">{emp.avatar}</div><div><p className="text-sm font-bold text-gray-800">{emp.name}</p><p className="text-[11px] text-gray-500 mt-0.5">{emp.empId} • {emp.dept}</p></div></div></td>
                  <td className="p-4 text-sm text-gray-600 font-medium">{emp.phone}</td>
                  <td className="p-4">{emp.hasFaceData ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-medium border border-emerald-100 flex items-center gap-1.5 w-max"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Đã cập nhật</span> : <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-md text-xs font-medium border border-orange-100 flex items-center gap-1.5 w-max"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Chưa cập nhật</span>}</td>
                  <td className="p-4 text-center"><button onClick={() => handleEditEmp(emp.name)} className="text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors">Chỉnh sửa</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filteredEmployees.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white">
            <span className="text-sm text-gray-500">Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} của {filteredEmployees.length} nhân viên</span>
            <div className="flex gap-1.5">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'<'}</button>
              {[...Array(totalEmpPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(totalEmpPages, prev + 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'>'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/50 mb-4">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <div><h1 className="text-white font-bold text-sm tracking-wide">FaceAttendance</h1><p className="text-[11px] text-slate-400">Hệ thống quản trị</p></div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-3 mt-2">
          <button onClick={() => setActiveTab('TONG_QUAN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'TONG_QUAN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>Tổng quan</button>
          <button onClick={() => setActiveTab('NHAN_VIEN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'NHAN_VIEN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>Nhân viên</button>
          <button onClick={() => setActiveTab('BANG_CONG')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'BANG_CONG' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Bảng công</button>
          <button onClick={() => setActiveTab('YEU_CAU')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'YEU_CAU' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>Yêu cầu chờ duyệt</button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'TONG_QUAN' && 'Tổng quan hệ thống'}
              {activeTab === 'NHAN_VIEN' && 'Quản lý hồ sơ nhân viên'}
              {activeTab === 'BANG_CONG' && 'Quản lý dữ liệu chấm công'}
              {activeTab === 'YEU_CAU' && 'Xét duyệt yêu cầu chỉnh sửa'}
            </h2>
          </div>
          
          <div className="flex items-center gap-5" ref={headerRef}>
            <div className="relative">
              <button onClick={() => {setShowMonthMenu(!showMonthMenu); setShowNotiMenu(false); setShowProfileMenu(false);}} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Tháng {selectedMonth}
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showMonthMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {showMonthMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  {['9/2026', '8/2026', '7/2026'].map((month) => (
                    <button key={month} onClick={() => {setSelectedMonth(month); setShowMonthMenu(false);}} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 flex items-center justify-between ${selectedMonth === month ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-700 font-medium'}`}>
                      Tháng {month} {selectedMonth === month && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => {setShowNotiMenu(!showNotiMenu); setShowProfileMenu(false); setShowMonthMenu(false);}} className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              {showNotiMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-xl py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-gray-50 mb-2 flex justify-between items-center"><h4 className="font-bold text-gray-800">Thông báo mới</h4><span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => {setActiveTab('YEU_CAU'); setShowNotiMenu(false);}}>Xem tất cả</span></div>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => {setActiveTab('YEU_CAU'); setShowNotiMenu(false);}}>
                    <p className="text-sm text-gray-800 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span>Yêu cầu chỉnh sửa mới</p>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">Nhân viên Nguyễn Văn An vừa gửi một yêu cầu.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-gray-200"></div>

            <div className="relative">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {setShowProfileMenu(!showProfileMenu); setShowNotiMenu(false); setShowMonthMenu(false);}}>
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-[#172554] transition-colors">A</div>
                <div><p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">Admin</p><p className="text-[11px] text-gray-500">Quản trị hệ thống</p></div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
              </div>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-slate-50 rounded-t-xl"><p className="text-sm font-bold text-gray-800">Tài khoản Admin</p></div>
                  <button onClick={() => navigate('/login')} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'TONG_QUAN' && (
            <div className="animate-fade-in">
              {renderSummaryCards()}
              {renderAttendanceTable(false)}
              {renderRequestsTable()}
            </div>
          )}
          {activeTab === 'NHAN_VIEN' && <div className="animate-fade-in">{renderEmployeesTable()}</div>}
          {activeTab === 'BANG_CONG' && <div className="animate-fade-in">{renderAttendanceTable(true)}</div>}
          {activeTab === 'YEU_CAU' && <div className="animate-fade-in">{renderRequestsTable()}</div>}
        </div>
      </div>

      {/* POPUP THÊM NHÂN VIÊN MỚI (CÓ MẮT ẨN HIỆN MẬT KHẨU) */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h3 className="text-lg font-bold text-gray-800">Tạo mới hồ sơ nhân viên</h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên</label>
                    <input type="text" required placeholder="VD: Nguyễn Văn A" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mã NV</label>
                    <input type="text" required placeholder="VD: NV006" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng ban</label>
                    <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer">
                      <option>Phòng Kinh doanh</option>
                      <option>Phòng Kế toán</option>
                      <option>Phòng Kỹ thuật</option>
                      <option>Phòng Nhân sự</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                    <input type="text" required placeholder="Nhập SĐT..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* THÊM TRƯỜNG MẬT KHẨU VÀ ICON MẮT */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu đăng nhập</label>
                  <div className="relative">
                    <input 
                      type={showEmpPassword ? "text" : "password"} 
                      required 
                      placeholder="Nhập mật khẩu cho nhân viên..." 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 pr-12" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowEmpPassword(!showEmpPassword)}
                      className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showEmpPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dữ liệu khuôn mặt AI</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      {/* ĐÃ ĐỔI ICON SANG HÌNH USER THEO YÊU CẦU */}
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click để Mở Camera & Chụp ảnh</p>
                    <p className="text-xs text-gray-500 mt-1">Yêu cầu chụp chính diện, rõ mặt</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddEmpModal(false)} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={isSubmittingEmp} className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex justify-center items-center gap-2 transition-colors">
                  {isSubmittingEmp ? 'Đang tạo hồ sơ...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;