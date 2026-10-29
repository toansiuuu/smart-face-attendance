import SchedulePanel from './SchedulePanel';
import PasswordDialog from './PasswordDialog';
import FaceEnrollmentDialog from './FaceEnrollmentDialog';
import DepartmentPanel from './DepartmentPanel';
import Modal from './Modal';
import {api,allPages,localDay,currentMonth,months,monthRange,attendanceRow,correctionRow,labels,logout} from '../api';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const Dashboard = ({initialTab = 'TONG_QUAN'}) => {
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [faceEmployee, setFaceEmployee] = useState(null);
  const [notice, setNotice] = useState('');
  const [apiError,setApiError]=useState('');
  const [user,setUser]=useState(null);
  const [policy,setPolicy]=useState(null);
  const [reload,setReload]=useState(0);

  const [activeTab, setActiveTabState] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedMonth, setSelectedMonthState] = useState(currentMonth());
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modal Thêm nhân viên
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [showEmpPassword, setShowEmpPassword] = useState(false);

  // State Tìm kiếm & Lọc
  const [empSearchTerm, setEmpSearchTermState] = useState('');
  const [empDeptFilter, setEmpDeptFilterState] = useState('Tất cả phòng ban');
  const [attSearchTerm, setAttSearchTermState] = useState('');
  const [attStatusFilter, setAttStatusFilterState] = useState('Tất cả trạng thái');
  const [attDateFilter, setAttDateFilterState] = useState(localDay());

  const [reqSubTab, setReqSubTabState] = useState('PENDING'); 

  const setActiveTab = value => {setActiveTabState(value);setCurrentPage(1);};
  const setEmpSearchTerm = value => {setEmpSearchTermState(value);setCurrentPage(1);};
  const setEmpDeptFilter = value => {setEmpDeptFilterState(value);setCurrentPage(1);};
  const setAttSearchTerm = value => {setAttSearchTermState(value);setCurrentPage(1);};
  const setAttStatusFilter = value => {setAttStatusFilterState(value);setCurrentPage(1);};
  const setAttDateFilter = value => {setAttDateFilterState(value);setCurrentPage(1);};
  const setReqSubTab = value => {setReqSubTabState(value);setCurrentPage(1);};
  const setSelectedMonth = value => {setSelectedMonthState(value);setCurrentPage(1);};
  const headerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowProfileMenu(false); setShowMonthMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= DỮ LIỆU TỪ API =================
  const [employees,setEmployees]=useState([]);
  const [deptList,setDeptList]=useState([]);

  const [records,setRecords]=useState([]);

  const [requests,setRequests]=useState([]);

  // ================= BỘ LỌC DỮ LIỆU =================
  useEffect(()=>{let active=true;
    const range=monthRange(selectedMonth);
    Promise.resolve().then(()=>{if(active){setIsLoading(true);setApiError('');}return Promise.all([api('/auth/me'),api('/policy'),allPages('/corrections'),allPages('/employees'),allPages(`/attendance?from=${range.from}&to=${range.to}`),api('/departments')]);})
      .then(([u,p,c,e,a,d])=>{if(!active)return;setUser(u);setPolicy(p);setRequests(c.map(correctionRow));setEmployees(e.map(x=>({...x,phone:x.phone||"",dept:x.dept||"—"})));setRecords(a.map(attendanceRow));setDeptList(d);})
      .catch(e=>{if(active)setApiError(e.message);})
      .finally(()=>{if(active)setIsLoading(false);});return()=>{active=false;};
  },[selectedMonth,reload]);
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(empSearchTerm.toLowerCase()) || emp.empId.toLowerCase().includes(empSearchTerm.toLowerCase()) || emp.phone.includes(empSearchTerm);
    const matchesDept = empDeptFilter === 'Tất cả phòng ban' || (empDeptFilter === '__unassigned__' ? !emp.dept : emp.dept === empDeptFilter);
    return matchesSearch && matchesDept;
  });
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalEmpPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;

  const filteredRecords = records.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(attSearchTerm.toLowerCase()) || rec.empId.toLowerCase().includes(attSearchTerm.toLowerCase());
    const matchesStatus = attStatusFilter === 'Tất cả trạng thái' || rec.status === attStatusFilter;
    let matchesDate = true;
    if (attDateFilter) {
      const [year, month, day] = attDateFilter.split('-');
      matchesDate = rec.date === `${day}/${month}/${year}`;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });
  const totalAttPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  
  const filteredRequests = requests.filter(req => req.status === reqSubTab);

  // ================= CÁC HÀM XỬ LÝ =================
  const handleAction=async(action,id)=>{try{setApiError('');const note=window.prompt('Ghi chú xét duyệt (không bắt buộc):','');if(note===null)return;await api(`/corrections/${id}/review`,{method:'POST',body:{approve:action==='Duyệt',note}});setReload(x=>x+1);}catch(e){setApiError(e.message);}};
  const handleAddEmployee=async(e)=>{e.preventDefault();setIsSubmittingEmp(true);setApiError('');const data=new FormData(e.currentTarget);const dId=data.get('departmentId');try{await api('/employees',{method:'POST',body:{employeeCode:data.get('employeeCode'),fullName:data.get('fullName'),password:data.get('password'),departmentId:dId?Number(dId):null}});setShowAddEmpModal(false);setReload(x=>x+1);}catch(error){setApiError(error.message);}finally{setIsSubmittingEmp(false);}};
  const editEmployee=async(emp)=>{const name=window.prompt('Tên nhân viên:',emp.name);if(name===null)return;try{await api(`/employees/${emp.id}`,{method:'PATCH',body:{fullName:name,status:emp.workStatus==='Đang làm việc'?'ACTIVE':'INACTIVE',departmentId:emp.deptId?Number(emp.deptId):null}});setReload(x=>x+1);}catch(e){setApiError(e.message);}};
  const toggleEmployee=async(emp)=>{try{await api(`/employees/${emp.id}`,{method:'PATCH',body:{fullName:emp.name,status:emp.workStatus==='Đang làm việc'?'INACTIVE':'ACTIVE',departmentId:emp.deptId?Number(emp.deptId):null}});setReload(x=>x+1);}catch(e){setApiError(e.message);}};
  const [assignDeptEmp, setAssignDeptEmp] = useState(null);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BangCong');

    worksheet.columns = [
      { header: 'Mã NV', key: 'empId', width: 15 },
      { header: 'Tên nhân viên', key: 'name', width: 25 },
      { header: 'Phòng ban', key: 'dept', width: 20 },
      { header: 'Ngày chấm công', key: 'date', width: 18 },
      { header: 'Vào sáng', key: 'timeIn', width: 15 },
      { header: 'Ra trưa', key: 'lunchOut', width: 15 },
      { header: 'Vào chiều', key: 'afternoonIn', width: 15 },
      { header: 'Phút làm việc', key: 'workedMinutes', width: 18 },
      { header: 'Giờ ra', key: 'timeOut', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };

    filteredRecords.forEach(rec => {
      worksheet.addRow({ empId: rec.empId, name: rec.name, dept: rec.dept, date: rec.date, timeIn: rec.timeIn, timeOut: rec.timeOut, lunchOut:rec.milestones.LUNCH_OUT, afternoonIn:rec.milestones.AFTERNOON_IN, workedMinutes:rec.workedMinutes, status: rec.status });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `BangCong_${attDateFilter || 'TatCa'}.xlsx`);
  };

  const renderStatusBadge = (status) => {
    const baseClass = "px-3 py-1.5 rounded-md text-[13px] font-bold inline-block text-center w-[110px] whitespace-nowrap shadow-sm";
    switch (status) {
      case 'Thiếu giờ ra': return <span className={`${baseClass} bg-red-50 text-red-500 border border-red-100`}>{status}</span>;
      case 'Đúng giờ': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`}>{status}</span>;
      case 'Đi muộn': return <span className={`${baseClass} bg-orange-50 text-orange-500 border border-orange-100`}>{status}</span>;
      default: return <span className={`${baseClass} bg-gray-50 text-gray-600 border border-gray-200`}>{status}</span>;
    }
  };

  // ================= CÁC COMPONENT RENDER =================
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg></div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Ngày–nhân viên trong tháng</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{records.length}</p>}
            <span className="text-sm text-gray-400">· {employees.length} nhân viên</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Đi muộn</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{records.filter(r => r.status === 'Đi muộn').length}</p>}
            <span className="text-sm text-gray-400">trong tháng</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Cần duyệt</p>
          <div className="flex items-baseline gap-2">
            {isLoading ? <div className="h-8 w-10 bg-gray-200 animate-pulse rounded"></div> : <p className="text-3xl font-black text-gray-800">{requests.filter(r => r.status === 'PENDING').length}</p>}
            <span className="text-sm text-gray-400">yêu cầu</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardOverview = () => (
    <div className="animate-fade-in">
      {renderSummaryCards()}
      
      {/* Bảng công rút gọn */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-gray-800 text-lg">Bảng công gần đây</h3>
          <span className="text-sm text-blue-600 cursor-pointer hover:underline font-medium" onClick={() => setActiveTab('BANG_CONG')}>Xem tất cả dữ liệu</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-slate-500 text-sm border-b border-gray-100">
              <th className="p-4 font-semibold w-1/4">Nhân viên</th><th className="p-4 font-semibold w-1/5">Ngày</th><th className="p-4 font-semibold w-1/5 text-center">Giờ vào</th><th className="p-4 font-semibold w-1/5 text-center">Giờ ra</th><th className="p-4 font-semibold w-1/5 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(3)].map((_, idx) => (
                <tr key={idx} className="animate-pulse"><td className="p-4 flex gap-3"><div className="w-9 h-9 bg-gray-200 rounded-full"></div><div className="h-5 bg-gray-200 rounded w-24 mt-1"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-20"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td><td className="p-4 flex justify-center"><div className="h-7 bg-gray-200 rounded-md w-[110px]"></div></td></tr>
              ))
            ) : (
              records.slice(0, 3).map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 border border-blue-100">{record.avatar}</div><div><p className="text-sm font-bold text-gray-800">{record.name}</p><p className="text-[11px] text-gray-500">{record.empId} • {record.dept}</p></div></div></td>
                  <td className="p-4 text-sm text-gray-600">{record.date}</td>
                  <td className="p-4 text-sm text-gray-800 font-bold text-center">{record.timeIn}</td>
                  <td className="p-4 text-sm text-gray-800 font-bold text-center">{record.timeOut}<details className="text-xs font-normal mt-2 text-left"><summary>4 mốc / giờ làm</summary>{Object.entries(record.milestones||{}).map(([k,v])=><div key={k}>{labels[k]}: {v}</div>)}<div>{record.workedMinutes} phút (cặp hợp lệ)</div></details></td>
                  <td className="p-4 text-center">{renderStatusBadge(record.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Yêu cầu rút gọn */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 animate-fade-in">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-gray-800 text-lg">Yêu cầu chờ duyệt</h3>
          <span className="text-sm text-blue-600 cursor-pointer hover:underline font-medium" onClick={() => setActiveTab('YEU_CAU')}>Xem tất cả</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-slate-500 text-sm border-b border-gray-100">
              <th className="p-4 font-semibold w-1/4">Nhân viên</th><th className="p-4 font-semibold w-1/5">Ngày cần sửa</th><th className="p-4 font-semibold w-1/3">Lý do chi tiết</th><th className="p-4 font-semibold w-1/4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(2)].map((_, idx) => <tr key={idx} className="animate-pulse"><td className="p-4 flex gap-3"><div className="w-8 h-8 bg-gray-200 rounded-full"></div><div className="h-5 bg-gray-200 rounded w-24 mt-1"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-24"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-full"></div></td><td className="p-4"><div className="h-8 bg-gray-200 rounded-md w-full max-w-[120px] mx-auto"></div></td></tr>)
            ) : (
              requests.filter(r => r.status === 'PENDING').map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-orange-100 text-orange-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0">{req.name.charAt(0)}</div><div><p className="text-sm font-bold text-gray-800">{req.name}</p><p className="text-[11px] text-gray-500">{req.empId}</p></div></div></td>
                  <td className="p-4 text-sm text-gray-800 font-medium">{req.dateTarget}</td>
                  <td className="p-4 text-sm text-gray-600 truncate max-w-xs">{req.reason}</td>
                  <td className="p-4"><div className="flex items-center justify-center gap-2"><button onClick={() => handleAction('Duyệt', req.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium flex items-center gap-1.5 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Duyệt</button></div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendanceTableFull = () => {
    const currentRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 animate-fade-in">
        {renderSummaryCards()}

        <div className="px-6 py-5 border-b border-gray-100 bg-white border-t border-t-gray-100">
          <h3 className="font-bold text-gray-800 text-xl mb-5">Danh sách chấm công</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" value={attSearchTerm} onChange={(e) => setAttSearchTerm(e.target.value)} placeholder="Tìm kiếm mã NV, tên..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-gray-700" />
            </div>
            <div className="flex gap-3">
              <input type="date" value={attDateFilter} onChange={(e) => setAttDateFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 transition-colors cursor-pointer min-w-[150px] shadow-sm" />
              <select value={attStatusFilter} onChange={(e) => setAttStatusFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 transition-colors min-w-[160px] cursor-pointer shadow-sm">
                <option value="Tất cả trạng thái">Tất cả trạng thái</option>
                <option value="Đúng giờ">Đúng giờ</option>
                <option value="Đi muộn">Đi muộn</option>
                <option value="Thiếu giờ ra">Thiếu giờ ra</option>
              </select>
              <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Xuất Excel
              </button>
            </div>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-slate-500 text-sm border-b border-gray-100">
              <th className="p-4 font-semibold w-1/4">Nhân viên</th><th className="p-4 font-semibold w-1/5">Ngày</th><th className="p-4 font-semibold w-1/5 text-center">Giờ vào</th><th className="p-4 font-semibold w-1/5 text-center">Giờ ra</th><th className="p-4 font-semibold w-1/5 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              [...Array(5)].map((_, idx) => (
                <tr key={idx} className="animate-pulse"><td className="p-4 flex gap-3"><div className="w-9 h-9 bg-gray-200 rounded-full"></div><div className="h-5 bg-gray-200 rounded w-24 mt-1"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-20"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td><td className="p-4"><div className="h-5 bg-gray-200 rounded w-16 mx-auto"></div></td><td className="p-4 flex justify-center"><div className="h-7 bg-gray-200 rounded-md w-[110px]"></div></td></tr>
              ))
            ) : currentRecords.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-gray-500">Không tìm thấy dữ liệu chấm công phù hợp.</td></tr>
            ) : (
              currentRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 border border-blue-100">{record.avatar}</div><div><p className="text-sm font-bold text-gray-800">{record.name}</p><p className="text-[11px] text-gray-500">{record.empId} • {record.dept}</p></div></div></td>
                  <td className="p-4 text-sm text-gray-600">{record.date}</td>
                  <td className="p-4 text-sm text-gray-800 font-bold text-center">{record.timeIn}</td>
                  <td className="p-4 text-sm text-gray-800 font-bold text-center">{record.timeOut}<details className="text-xs font-normal mt-2 text-left"><summary>4 mốc / giờ làm</summary>{Object.entries(record.milestones||{}).map(([k,v])=><div key={k}>{labels[k]}: {v}</div>)}<div>{record.workedMinutes} phút (cặp hợp lệ)</div></details></td>
                  <td className="p-4 text-center">{renderStatusBadge(record.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filteredRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white">
            <span className="text-sm text-gray-500 font-medium">Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} của {filteredRecords.length} dữ liệu</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'<'}</button>
              {[...Array(totalAttPages)].map((_, i) => <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i + 1}</button>)}
              <button onClick={() => setCurrentPage(prev => Math.min(totalAttPages, prev + 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">{'>'}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEmployeesTable = () => (
    <div className="mb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Hồ sơ nhân viên</h3>
        <button onClick={() => setShowAddEmpModal(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>Thêm nhân viên
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" value={empSearchTerm} onChange={(e) => setEmpSearchTerm(e.target.value)} placeholder="Tìm kiếm theo Tên, Mã NV..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" />
        </div>
        <select value={empDeptFilter} onChange={(e) => setEmpDeptFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 transition-colors min-w-[200px] cursor-pointer shadow-sm">
          <option value="Tất cả phòng ban">Tất cả phòng ban</option>
          <option value="__unassigned__">Chưa phân phòng ban</option>
          {[...new Set(employees.filter(e=>e.dept).map(e=>e.dept))].sort().map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-[#f8fafc] text-gray-500 text-sm border-b border-gray-200"><th className="p-4 font-semibold w-1/4">Nhân viên</th><th className="p-4 font-semibold w-1/5">Số điện thoại</th><th className="p-4 font-semibold w-1/5">Trạng thái</th><th className="p-4 font-semibold w-1/5">Dữ liệu khuôn mặt</th><th className="p-4 font-semibold w-1/6 text-center">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, idx) => <tr key={idx} className="animate-pulse"><td className="p-4 flex gap-3 items-center"><div className="w-10 h-10 bg-gray-200 rounded-full"></div><div><div className="h-4 bg-gray-200 rounded w-24 mb-1.5"></div><div className="h-3 bg-gray-200 rounded w-32"></div></div></td><td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td><td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td><td className="p-4"><div className="h-6 bg-gray-200 rounded-md w-28"></div></td><td className="p-4"><div className="h-8 bg-gray-200 rounded-md w-16 mx-auto"></div></td></tr>)
            ) : currentEmployees.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Không tìm thấy nhân viên phù hợp.</td></tr>
            ) : (
              currentEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-sm shrink-0 border border-blue-100">{emp.avatar}</div><div><p className="text-sm font-bold text-gray-800">{emp.name}</p><p className="text-[11px] text-gray-500 mt-0.5">{emp.empId} • {emp.dept}</p></div></div></td>
                  <td className="p-4 text-sm text-gray-600 font-bold">{emp.phone}</td>
                  <td className="p-4">{emp.workStatus === 'Đang làm việc' ? <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded text-xs font-bold border border-green-100">Đang làm việc</span> : <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold border border-gray-200">Đã nghỉ việc</span>}</td>
                  <td className="p-4">{emp.hasFaceData ? <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-bold border border-emerald-100 flex items-center gap-1.5 w-max"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Đã cập nhật</span> : <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-md text-xs font-bold border border-orange-100 flex items-center gap-1.5 w-max"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Chưa cập nhật</span>}</td>
                  <td className="p-4 text-center"><div className="flex flex-col gap-2"><button disabled={emp.workStatus!=='Đang làm việc'} onClick={()=>{setNotice('');setFaceEmployee(emp);}} className="text-sm font-bold text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed">{emp.hasFaceData?'Cập nhật khuôn mặt':'Đăng ký khuôn mặt'}</button><button onClick={()=>editEmployee(emp)} className="text-blue-600 text-sm font-bold">Đổi tên</button><button onClick={()=>setAssignDeptEmp(emp)} className="text-blue-600 text-sm font-bold">Gán phòng ban</button><button onClick={()=>toggleEmployee(emp)} className="text-sm underline">{emp.workStatus==='Đang làm việc'?'Ngừng hoạt động':'Kích hoạt lại'}</button></div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filteredEmployees.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white">
            <span className="text-sm text-gray-500">Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} của {filteredEmployees.length} nhân viên</span>
            <div className="flex gap-1.5">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">{'<'}</button>
              {[...Array(totalEmpPages)].map((_, i) => <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{i + 1}</button>)}
              <button onClick={() => setCurrentPage(prev => Math.min(totalEmpPages, prev + 1))} className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">{'>'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRequestsCardsView = () => (
    <div className="animate-fade-in mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Yêu cầu chỉnh sửa</h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">Xét duyệt các báo cáo sai sót từ nhân viên</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setReqSubTab('PENDING')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${reqSubTab === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Chờ xét duyệt • {requests.filter(r => r.status === 'PENDING').length}
        </button>
        <button onClick={() => setReqSubTab('APPROVED')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${reqSubTab === 'APPROVED' ? 'bg-white border-2 border-emerald-500 text-emerald-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Đã duyệt
        </button>
        <button onClick={() => setReqSubTab('REJECTED')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${reqSubTab === 'REJECTED' ? 'bg-white border-2 border-red-500 text-red-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Từ chối
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div><div className="flex gap-4 mb-4"><div className="flex-1 h-20 bg-gray-100 rounded-xl"></div><div className="flex-1 h-20 bg-gray-100 rounded-xl"></div></div><div className="h-4 bg-gray-200 rounded w-full mb-2"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div></div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">Không có yêu cầu nào trong mục này.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">Yêu cầu #{req.id} • <span className="text-blue-600">{req.name}</span></h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Ngày chấm công: {req.dateTarget} • Đã gửi: {req.submitTime}</p>
                </div>
                {req.status === 'PENDING' && <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold border border-blue-100">Chờ xét duyệt</span>}
                {req.status === 'APPROVED' && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold border border-emerald-100">Đã duyệt</span>}
              </div>

              <div className="space-y-4 mb-6 border-b border-gray-50 pb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Dữ liệu hệ thống ghi nhận ({req.scanType})</p>
                  <p className="text-lg font-bold text-gray-800">{req.recordedTime}</p>
                </div>
                
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Giờ nhân viên đề xuất</p>
                  <p className="text-2xl font-bold text-blue-700">{req.requestedTime}</p>
                </div>

                <p className="text-sm text-gray-700 font-medium italic mt-4 pl-1">"{req.reason}"</p>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-800">Tệp đính kèm (Minh chứng)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Hình ảnh hoặc ghi chú tùy chọn</p>
                </div>
                <button disabled title="Chưa hỗ trợ tệp đính kèm" className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${req.attachments > 0 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}>
                  {req.attachments} Tệp đính kèm
                </button>
              </div>

              <div className="flex gap-3">
                {req.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleAction('Duyệt', req.id)} className="px-6 py-2.5 bg-[#0ea5e9] hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors shadow-sm active:scale-95">Duyệt chỉnh sửa</button>
                    <button onClick={() => handleAction('Từ chối', req.id)} className="px-6 py-2.5 bg-white border border-gray-200 hover:border-red-300 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors active:scale-95">Từ chối</button>
                  </>
                )}
                <button onClick={()=>{const [d,m,y]=req.dateTarget.split('/');setSelectedMonth(`${Number(m)}/${y}`);setAttDateFilter(`${y}-${m}-${d}`);setAttSearchTerm(req.empId);setAttStatusFilter('Tất cả trạng thái');setActiveTab('BANG_CONG');}} className="px-6 py-2.5 bg-white border border-gray-800 text-gray-800 hover:bg-gray-80 rounded-xl font-bold text-sm transition-colors ml-auto flex items-center gap-2 border-2">
                  Xem lịch sử chấm công
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/50 mb-4">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
          <div><h1 className="text-white font-bold text-sm tracking-wide">FaceAttendance</h1><p className="text-[11px] text-slate-400">Hệ thống quản trị</p></div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-3 mt-2">
          <button onClick={() => setActiveTab('TONG_QUAN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'TONG_QUAN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>Tổng quan</button>
          <button onClick={() => setActiveTab('NHAN_VIEN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'NHAN_VIEN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>Nhân viên</button>
          <button onClick={() => setActiveTab('PHONG_BAN')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'PHONG_BAN' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>Phòng ban</button>
          <button onClick={() => setActiveTab('BANG_CONG')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'BANG_CONG' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Bảng công</button>
          <button onClick={() => setActiveTab('YEU_CAU')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'YEU_CAU' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>Yêu cầu chờ duyệt</button>
          <button onClick={() => setActiveTab('CAU_HINH_LICH')} aria-current={activeTab === 'CAU_HINH_LICH' ? 'page' : undefined} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left ${activeTab === 'CAU_HINH_LICH' ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-500 font-semibold' : 'hover:bg-slate-800 opacity-80 font-medium'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" d="M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 011 1v14H4V6a1 1 0 011-1z"/></svg>Cấu hình lịch</button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-100 shrink-0 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'TONG_QUAN' && 'Tổng quan hệ thống'}{activeTab === 'NHAN_VIEN' && 'Quản lý hồ sơ nhân viên'}{activeTab === 'PHONG_BAN' && 'Quản lý phòng ban'}{activeTab === 'BANG_CONG' && 'Quản lý dữ liệu chấm công'}{activeTab === 'YEU_CAU' && 'Xét duyệt yêu cầu chỉnh sửa'}{activeTab === 'CAU_HINH_LICH' && 'Cấu hình lịch làm việc'}
            </h2>
          </div>
          <div className="flex items-center gap-5" ref={headerRef}>
            <div className="relative">
              <button onClick={() => {setShowMonthMenu(!showMonthMenu); setShowProfileMenu(false);}} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">Tháng {selectedMonth}</button>
              {showMonthMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in">
                  {months().map((month) => (
                    <button key={month} onClick={() => {setSelectedMonth(month); setAttDateFilter(''); setShowMonthMenu(false);}} className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 flex items-center justify-between ${selectedMonth === month ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-700 font-medium'}`}>Tháng {month}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveTab('YEU_CAU')} className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg><span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span></button>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>

            <div className="relative">
              <button type="button" aria-label="Menu tài khoản" aria-expanded={showProfileMenu} className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white font-bold shadow-sm">A</div>
                <div><p className="text-sm font-bold text-gray-800">{user?.name}</p></div>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-fade-in"><button onClick={() => {setShowProfileMenu(false); setShowPasswordDialog(true);}} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 font-medium">Đổi mật khẩu</button><button onClick={() => logout(navigate).catch(e=>setApiError(e.message))} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold">Đăng xuất</button></div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full"><div className="mb-4 flex gap-3"><button onClick={()=>setReload(x=>x+1)}>Làm mới</button></div>
          {apiError&&<p role="alert" className="bg-red-50 text-red-700 p-3 mb-3">{apiError}</p>}
          {!policy?.policyConfigured&&<p className="bg-amber-50 p-3 mb-3">Chưa xác nhận ngày làm việc. Chưa tính tổng ngày vắng.</p>}
          <p className="text-sm text-gray-500 mb-3">Số điện thoại và tệp đính kèm chưa được lưu: đang chờ phê duyệt thay đổi CSDL.</p>
          {activeTab === 'CAU_HINH_LICH' && <SchedulePanel/>}
          {notice && <p role="status" className="mb-3 rounded-xl bg-green-50 p-3 text-green-700">{notice}</p>}
          {activeTab === 'TONG_QUAN' && <div className="animate-fade-in">{renderDashboardOverview()}</div>}
          {activeTab === 'NHAN_VIEN' && <div className="animate-fade-in">{renderEmployeesTable()}</div>}
          {activeTab === 'PHONG_BAN' && <DepartmentPanel employees={employees} onReload={()=>setReload(x=>x+1)}/>}
          {activeTab === 'BANG_CONG' && <div className="animate-fade-in">{renderAttendanceTableFull()}</div>}
          {activeTab === 'YEU_CAU' && <div className="animate-fade-in">{renderRequestsCardsView()}</div>}
        </div>
      </div>
      
      {assignDeptEmp && (
        <Modal title={`Gán phòng ban — ${assignDeptEmp.name}`} onClose={()=>setAssignDeptEmp(null)}>
          <form onSubmit={async(ev)=>{ev.preventDefault();const dId=new FormData(ev.currentTarget).get('deptId');try{await api(`/employees/${assignDeptEmp.id}`,{method:'PATCH',body:{fullName:assignDeptEmp.name,status:assignDeptEmp.workStatus==='Đang làm việc'?'ACTIVE':'INACTIVE',departmentId:dId?Number(dId):null}});setAssignDeptEmp(null);setReload(x=>x+1);}catch(err){setApiError(err.message);}}}>
            <select name="deptId" defaultValue={assignDeptEmp.deptId||''} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer mb-4">
              <option value="">— Không thuộc phòng ban —</option>
              {deptList.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="flex gap-3"><button type="button" onClick={()=>setAssignDeptEmp(null)} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm">Hủy</button><button type="submit" className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm">Lưu</button></div>
          </form>
        </Modal>
      )}
      {showPasswordDialog && <PasswordDialog onClose={()=>setShowPasswordDialog(false)}/>}
      {faceEmployee && <FaceEnrollmentDialog employee={faceEmployee} onClose={()=>setFaceEmployee(null)} onSaved={employee=>{setFaceEmployee(null);setNotice(`Đã lưu khuôn mặt cho ${employee.name}.`);setReload(x=>x+1);}}/>}
      {/* Modal Thêm Nhân viên */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h3 className="text-lg font-bold text-gray-800">Tạo mới hồ sơ nhân viên</h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6">{apiError&&<p className="text-red-600" role="alert">{apiError}</p>}<p className="text-sm mb-3">Tên đăng nhập = Mã NV. Mật khẩu tối thiểu 12 ký tự.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên</label>
                    <input type="text" name="fullName" required maxLength={150} placeholder="VD: Nguyễn Văn A" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mã NV</label>
                    <input type="text" name="employeeCode" required maxLength={32} placeholder="VD: NV006" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng ban</label>
                    <select name="departmentId" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer">
                      <option value="">— Chưa chỉ định —</option>
                      {deptList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                    <input type="text" disabled placeholder="Chưa hỗ trợ lưu SĐT" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu đăng nhập</label>
                  <div className="relative">
                    <input type={showEmpPassword ? "text" : "password"} name="password" minLength={12} required placeholder="Nhập mật khẩu cho nhân viên..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 pr-12" />
                    <button type="button" onClick={() => setShowEmpPassword(!showEmpPassword)} className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showEmpPassword ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dữ liệu khuôn mặt AI</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform"><svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
                    <p className="text-sm font-medium text-gray-700">Sau khi lưu hồ sơ, chọn Đăng ký khuôn mặt tại dòng nhân viên.</p>
                    <p className="text-xs text-gray-500 mt-1">Cần dịch vụ nhận diện thực được cấu hình</p>
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