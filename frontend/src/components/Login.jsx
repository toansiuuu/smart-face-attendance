import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate(); // Dùng hook của React Router để chuyển trang
  const [role, setRole] = useState('NHAN_VIEN');
  const [userId, setUserId] = useState(''); 
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Điều hướng theo quyền
    if (role === 'QUAN_LY') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full min-h-screen">
      {/* Nút quay lại Camera dùng navigate('/') */}
      <button 
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm font-medium flex items-center gap-2 transition-colors"
      >
        ⬅ Quay lại màn hình chấm công
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-4 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Đăng Nhập Hệ Thống</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
            <input type="text" required value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="flex items-center gap-6 mt-2 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="radio" name="role" value="NHAN_VIEN" checked={role === 'NHAN_VIEN'} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              Nhân viên
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="radio" name="role" value="QUAN_LY" checked={role === 'QUAN_LY'} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              Quản lý
            </label>
          </div>

          <button type="submit" className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold shadow-md transition-transform active:scale-95">
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;