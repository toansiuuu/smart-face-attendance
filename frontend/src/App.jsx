import Login from './components/Login';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 tracking-wide text-center uppercase">
        Hệ Thống Chấm Công AI
      </h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">Xác thực danh tính bằng công nghệ nhận diện khuôn mặt để đảm bảo tính minh bạch.</p>
      
      <div className="w-full">
        {/* Nhúng màn hình Login/Điều hướng vào đây */}
        <Login />
      </div>
    </div>
  );
}

export default App;