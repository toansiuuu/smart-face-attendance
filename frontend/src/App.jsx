import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import các màn hình bạn đã tạo
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Màn hình Admin
import EmployeeDashboard from './components/EmployeeDashboard'; // Màn hình Nhân viên

// Giả sử bạn có file trang chủ/quét khuôn mặt tên là Home.jsx
// import Home from './components/Home'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Route mặc định: Màn hình quét khuôn mặt */}
        {/* <Route path="/" element={<Home />} /> */}

        {/* ĐƯỜNG DẪN ĐĂNG NHẬP PHẢI TRỎ ĐÚNG VÀO COMPONENT <Login /> */}
        <Route path="/login" element={<Login />} />
        
        {/* Đường dẫn dành cho Quản lý */}
        <Route path="/admin" element={<Dashboard />} />
        
        {/* Đường dẫn dành cho Nhân viên */}
        <Route path="/employee" element={<EmployeeDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;