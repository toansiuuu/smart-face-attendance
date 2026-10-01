import {api} from '../api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(''); 
  const [password, setPassword] = useState('');
  
  // State quản lý ẩn/hiện mật khẩu bằng icon con mắt ở input
  const [showPassword, setShowPassword] = useState(false);

  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');setBusy(true);
    try {const user=await api('/auth/login',{method:'POST',body:{username:userId,password}});navigate(user.role==='MANAGER'?'/admin':'/employee');}
    catch(err){setError(err.message);}finally{setBusy(false);}
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full min-h-screen bg-gray-50 font-sans">
      
      {/* TIÊU ĐỀ LỚN CỦA HỆ THỐNG */}
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Hệ thống quản lý chấm công</h2>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 animate-fade-in">
        <div className="text-center mb-8">
          
          {/* ICON LOGO HÌNH CON MẮT */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mb-4 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800">Đăng Nhập Hệ Thống</h2>
        </div>

        <p role="alert" className="text-red-600">{error}</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
            <input 
              type="text" 
              required 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
              placeholder="Tên tài khoản / Mã nhân viên"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm pr-12" 
                placeholder="••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>

          <button disabled={busy} type="submit" className="w-full mt-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold shadow-md transition-transform active:scale-95">
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;