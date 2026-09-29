import React, { useRef, useState, useEffect } from 'react';

const FaceCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [screenState, setScreenState] = useState('SCANNING'); 
  const [successData, setSuccessData] = useState(null); 
  const [countdown, setCountdown] = useState(5); 

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        if (screenState === 'SCANNING') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Không thể truy cập camera. Vui lòng cấp quyền.');
      }
    };
    startCamera();
    
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [screenState]);

  useEffect(() => {
    let timer;
    if (screenState === 'SUCCESS' && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (screenState === 'SUCCESS' && countdown === 0) {
      setScreenState('SCANNING');
    }
    return () => clearInterval(timer);
  }, [screenState, countdown]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg');
      
      setIsLoading(true);
      try {
        // --- 1. KHI CÓ API THẬT, BẠN BỎ COMMENT ĐOẠN NÀY VÀ ĐỔI TÊN BIẾN CHO KHỚP ---
        /*
        const response = await fetch('http://localhost:8080/api/diem-danh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anhKhuonMat: base64Image })
        });
        
        if (!response.ok) throw new Error('Nhận diện thất bại');
        
        // Dữ liệu thực tế từ Backend (VD: { tenNhanVien: "Đạt", thoiGian: "08:00", caLam: "Ca Sáng", trangThai: "Vào ca thành công" })
        const backendData = await response.json(); 
        
        setSuccessData({
          name: backendData.tenNhanVien,
          time: backendData.thoiGian,
          shift: backendData.caLam,
          message: backendData.trangThai
        });
        */

        // --- 2. TẠM THỜI DÙNG DỮ LIỆU ĐỘNG GIẢ LẬP ĐỂ TEST TRONG SÁNG NAY ---
        const fakeBackendResponse = await new Promise(resolve => setTimeout(() => resolve({
          tenNhanVien: "Đang chờ API API...", 
          thoiGian: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          caLam: "Chờ dữ liệu backend",
          trangThai: "Chấm công thành công (Mock)"
        }), 1500));

        setSuccessData({
          name: fakeBackendResponse.tenNhanVien,
          time: fakeBackendResponse.thoiGian,
          shift: fakeBackendResponse.caLam,
          message: fakeBackendResponse.trangThai
        });
        
        setCountdown(5);
        setScreenState('SUCCESS'); 
      } catch (error) {
        alert('Lỗi chấm công, không tìm thấy khuôn mặt!');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex justify-center items-center p-4 w-full">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-xl pb-8">
        
        <div className="flex items-center justify-center gap-2 p-6 pb-2">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8V6a2 2 0 012-2h3m10 0h3a2 2 0 012 2v2M3 16v2a2 2 0 002 2h3m10 0h3a2 2 0 002-2v-2M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
          <h2 className="text-xl font-bold text-gray-800">Chấm công bằng khuôn mặt</h2>
        </div>

        {screenState === 'SCANNING' && (
          <div className="px-8 flex flex-col items-center mt-4 animate-fade-in">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            
            <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-6">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/70 relative">
                   <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                   <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                   <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                   <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <button 
              onClick={capturePhoto} 
              disabled={isLoading}
              className="bg-blue-50 text-blue-700 font-semibold py-3 px-8 rounded-full flex items-center gap-2 hover:bg-blue-100 transition-colors"
            >
              {isLoading ? 'Đang phân tích...' : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                Vui lòng nhìn vào camera</>
              )}
            </button>
            <p className="text-green-600 text-sm mt-3 flex items-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Camera đang bật
            </p>
          </div>
        )}

        {screenState === 'SUCCESS' && successData && (
          <div className="px-8 flex flex-col items-center justify-center py-10 animate-fade-in">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
            </div>
            
            {/* Tên và thông báo được truyền động từ API */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{successData.name}</h3>
            <div className="bg-green-100 text-green-700 font-semibold px-12 py-3 rounded-md text-lg mb-6 w-full text-center">
              {successData.message}
            </div>
            
            {/* Giờ và ca làm được truyền động từ API */}
            <div className="bg-gray-50 w-full py-6 rounded-xl border border-gray-100 flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {successData.time}
              </div>
              <p className="text-gray-500 text-sm">Ca hôm nay: {successData.shift}</p>
            </div>

            <button 
              onClick={() => setScreenState('SCANNING')}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Tự trở về màn hình quét ({countdown}s)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default FaceCapture;