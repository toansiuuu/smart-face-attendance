import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // BẮT BUỘC PHẢI IMPORT APP
import './index.css' // File CSS của Tailwind

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />  {/* ĐỂ ĐÂY LÀ <App /> CHỨ KHÔNG PHẢI MÀN HÌNH NÀO KHÁC */}
  </React.StrictMode>,
)