import React, { useState } from 'react';
import Skeleton from './Skeleton';

const Register = ({ onBackToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Giả lập gọi API đăng ký mất 2.5 giây
    setTimeout(() => {
      setIsLoading(false);
      alert('🎉 Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      onBackToLogin();
    }, 2500);
  };

  // HIỆU ỨNG SKELETON GỌI TỪ COMPONENT DÙNG CHUNG
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <Skeleton type="form" />
        </div>
      </div>
    );
  }

  // FORM ĐĂNG KÝ BÌNH THƯỜNG
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tạo Tài Khoản Mới</h2>
            <p className="text-gray-500 mt-1 text-sm">Đăng ký thông tin để sử dụng hệ thống</p>
          </div>
          <button onClick={onBackToLogin} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mã NV / ID</label>
              <input type="text" name="id" required onChange={handleChange} placeholder="Ví dụ: NV01" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và Tên</label>
              <input type="text" name="name" required onChange={handleChange} placeholder="Nguyễn Văn A" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label>
            <input type="tel" name="phone" required onChange={handleChange} placeholder="0901234567" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input type="email" name="email" required onChange={handleChange} placeholder="email@congty.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu</label>
            <input type="password" name="password" required onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <button type="submit" className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-transform active:scale-95">
            Đăng ký tài khoản
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          Đã có tài khoản? <span onClick={onBackToLogin} className="text-blue-600 font-semibold cursor-pointer hover:underline">Đăng nhập ngay</span>
        </p>

      </div>
    </div>
  );
};

export default Register;