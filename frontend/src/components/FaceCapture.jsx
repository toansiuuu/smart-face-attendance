import React, { useRef, useState, useEffect } from 'react';

// Chú ý: Đã nhận props userId từ màn hình Login truyền sang
const FaceCapture = ({ userId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Không thể truy cập camera. Vui lòng cấp quyền hoặc kiểm tra thiết bị.');
      }
    };
    startCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/jpeg');
      setImageSrc(base64Image);
      
      setIsLoading(true);
      setStatusMsg(null);
      
      try {
        const response = await fetch('http://localhost:8080/api/diem-danh', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maNhanVien: userId, // Lấy đúng ID vừa nhập từ màn hình Login
            anhKhuonMat: base64Image,
            loaiSuKien: 'VAO_CA', 
            thoiGian: new Date().toISOString()
          })
        });

        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatusMsg({ type: 'success', text: `🎉 Xác minh khuôn mặt thành công cho: ${userId}` });
        
      } catch (error) {
        console.error('Lỗi kết nối Backend:', error);
        setStatusMsg({ type: 'error', text: '⚠️ Không thể kết nối máy chủ. Vui lòng kiểm tra lại.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-md">
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">XÁC MINH HIỆN DIỆN</h2>
          {/* Hiển thị tên tài khoản đang chấm công để nhân viên biết */}
          <p className="text-blue-100 text-sm mt-1">Tài khoản: {userId}</p>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div className="relative w-full aspect-square md:aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden shadow-inner border-4 border-gray-100">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-lg"></div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <button 
            onClick={capturePhoto}
            disabled={isLoading || error}
            className={`w-full py-3.5 rounded-xl font-semibold text-white text-lg shadow-md transition-all duration-200 flex justify-center items-center gap-2
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}
            `}
          >
            {isLoading ? 'Đang xử lý...' : '📸 Chụp & Điểm danh'}
          </button>

          {statusMsg && (
            <div className={`w-full p-3 rounded-lg text-center font-medium text-sm animate-fade-in
              ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
            `}>
              {statusMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;