import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FaceCapture from './components/FaceCapture';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeDashboard from './components/EmployeeDashboard'; // Trang nhân viên mới tạo

function App() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-gray-50">
        <Routes>
          {/* Mặc định vào thẳng Camera chấm công */}
          <Route path="/" element={<FaceCapture />} />
          
          {/* Form đăng nhập */}
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard của Quản lý */}
          <Route path="/admin" element={<Dashboard />} />
          
          {/* Trang lịch sử cá nhân của Nhân viên */}
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;