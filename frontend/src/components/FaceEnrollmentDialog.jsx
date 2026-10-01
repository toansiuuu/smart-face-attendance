import {useEffect, useRef, useState} from 'react';
import {api} from '../api';
import Modal from './Modal';

export default function FaceEnrollmentDialog({employee, onClose, onSaved}) {
  const video = useRef(null);
  const [photo, setPhoto] = useState('');
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let disposed = false;
    let stream;
    navigator.mediaDevices?.getUserMedia({video: true, audio: false})
      .then(value => {
        stream = value;
        if (disposed) {stream.getTracks().forEach(track => track.stop()); return;}
        video.current.srcObject = stream;
      })
      .catch(() => {if (!disposed) setError('Không mở được camera. Hãy cấp quyền camera rồi thử lại.');});
    return () => {disposed = true; stream?.getTracks().forEach(track => track.stop());};
  }, [retry]);
  function capture() {
    if (!video.current?.videoWidth) {setError('Camera chưa sẵn sàng.'); return;}
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / video.current.videoWidth);
    canvas.width = Math.round(video.current.videoWidth * scale);
    canvas.height = Math.round(video.current.videoHeight * scale);
    canvas.getContext('2d').drawImage(video.current, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.85)); setError('');
  }
  async function save() {
    setBusy(true); setError('');
    try {
      await api(`/employees/${employee.id}/face-enrollment`, {method: 'POST', body: {image: photo}});
      onSaved(employee);
    } catch (err) {setError(err.message);} finally {setBusy(false);}
  }
  return <Modal title={employee.hasFaceData ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'} onClose={onClose} busy={busy}>
    <p className="font-semibold">{employee.name} <span className="text-sm font-normal text-gray-500">· {employee.empId}</span></p>
    <p className="my-3 text-sm text-gray-500">Nhìn thẳng vào camera, chụp ảnh rõ mặt rồi xác nhận đăng ký cho nhân viên này.</p>
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {!navigator.mediaDevices && <p role="alert" className="text-red-700">Camera cần truy cập bằng localhost hoặc HTTPS.</p>}
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
      <video ref={video} autoPlay playsInline muted onLoadedData={() => setReady(true)} className="h-full w-full object-cover"/>
      {photo && <img src={photo} alt="Ảnh khuôn mặt vừa chụp" className="absolute inset-0 h-full w-full object-cover"/>}
    </div>
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2">Hủy</button>
      {!ready && <button disabled={busy} onClick={() => {setError(''); setRetry(x => x + 1);}} className="rounded-xl border px-4 py-2">Thử lại camera</button>}
      <button disabled={busy || !ready} onClick={() => photo ? setPhoto('') : capture()} className="rounded-xl border border-blue-200 px-4 py-2 text-blue-600 disabled:opacity-50">{photo ? 'Chụp lại' : 'Chụp ảnh'}</button>
      <button disabled={busy || !photo} onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang đăng ký...' : 'Lưu khuôn mặt'}</button>
    </div>
  </Modal>;
}
