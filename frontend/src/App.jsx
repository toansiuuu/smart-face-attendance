import Protected from './components/Protected';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FaceCapture from './components/FaceCapture';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeDashboard from './components/EmployeeDashboard'; // Trang nhân viên mới tạo

function App() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-gray-50">
        <Routes><Route path="/password" element={<Navigate to="/admin" replace/>}/>
<Route path="/setup" element={<Protected role="MANAGER"><Dashboard initialTab="CAU_HINH_LICH" /></Protected>} />
          {/* Mặc định vào thẳng Camera chấm công */}
          <Route path="/" element={<FaceCapture />} />
          
          {/* Form đăng nhập */}
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard của Quản lý */}
          <Route path="/admin" element={<Protected role="MANAGER"><Dashboard /></Protected>} />
          
          {/* Trang lịch sử cá nhân của Nhân viên */}
          <Route path="/employee" element={<Protected role="EMPLOYEE"><EmployeeDashboard /></Protected>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;