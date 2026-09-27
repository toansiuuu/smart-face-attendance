import React from 'react';

const Skeleton = ({ type = 'form' }) => {
  if (type === 'table') {
    return (
      <>
        {[1, 2, 3, 4, 5].map((item) => (
          <tr key={item} className="animate-pulse border-b border-gray-100">
            <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
            <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
            <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
            <td className="p-4"><div className="h-6 bg-gray-200 rounded-md w-20"></div></td>
            <td className="p-4"><div className="h-6 bg-gray-200 rounded-md w-24"></div></td>
            <td className="p-4 text-center"><div className="h-8 bg-gray-200 rounded-lg w-20 mx-auto"></div></td>
          </tr>
        ))}
      </>
    );
  }

  if (type === 'card') {
    return (
      <div className="animate-pulse flex flex-col items-center w-full p-6">
        <div className="w-full aspect-square md:aspect-[4/3] bg-gray-200 rounded-xl mb-4"></div>
        <div className="h-12 bg-gray-200 rounded-xl w-full mt-2"></div>
      </div>
    );
  }

  // Mặc định là 'form' (Dùng cho Đăng ký / Đăng nhập)
  return (
    <div className="animate-pulse flex flex-col items-center w-full">
      <div className="rounded-full bg-gray-200 h-20 w-20 mb-6 shadow-sm"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
      
      <div className="space-y-4 w-full">
        <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-12 bg-gray-200 rounded-xl w-full mt-6"></div>
      </div>
      <p className="text-gray-400 mt-6 text-sm font-medium">Đang xử lý dữ liệu...</p>
    </div>
  );
};

export default Skeleton;