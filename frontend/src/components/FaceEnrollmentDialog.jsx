import {useEffect, useRef, useState} from 'react';
import {api} from '../api';
import Modal from './Modal';

const instructions = {
  CENTER: 'Nhìn thẳng vào camera và giữ đầu yên',
  LEFT: 'Xoay nhẹ đầu sang trái của bạn',
  RIGHT: 'Xoay nhẹ đầu sang phải của bạn',
  DONE: 'Đã hoàn thành kiểm tra chuyển động',
};

export default function FaceEnrollmentDialog({employee, onClose, onSaved}) {
  const video = useRef(null);
  const runId = useRef(0);
  const request = useRef(null);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [challenge, setChallenge] = useState(null);
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
    return () => {
      disposed = true;
      runId.current += 1;
      request.current?.abort();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [retry]);

  function frame() {
    if (!video.current?.videoWidth) throw new Error('Camera chưa sẵn sàng.');
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 640 / video.current.videoWidth);
    canvas.width = Math.round(video.current.videoWidth * scale);
    canvas.height = Math.round(video.current.videoHeight * scale);
    canvas.getContext('2d').drawImage(video.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  function reset() {
    runId.current += 1;
    request.current?.abort();
    setRunning(false); setChallenge(null); setError('');
  }

  async function start() {
    const current = ++runId.current;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setError(''); setChallenge(null); setRunning(true);
    try {
      const first = await api(`/employees/${employee.id}/face-enrollment/challenge`,
        {method: 'POST', signal: controller.signal});
      if (runId.current !== current) return;
      setChallenge(first);
      while (runId.current === current) {
        await new Promise(resolve => setTimeout(resolve, 650));
        if (runId.current !== current) return;
        try {
          const result = await api(`/employees/${employee.id}/face-enrollment/challenge/${first.challengeId}`,
            {method: 'POST', body: {image: frame()}, signal: controller.signal});
          if (runId.current !== current) return;
          setError(''); setChallenge({...result, challengeId: first.challengeId});
          if (result.complete) break;
        } catch (err) {
          if (runId.current !== current) return;
          if (err.status !== 422) throw err;
          setError(err.message);
        }
      }
    } catch (err) {
      if (runId.current === current) {setError(err.message); setChallenge(null);}
    } finally {
      if (runId.current === current) setRunning(false);
    }
  }

  async function save() {
    if (!challenge?.complete) return;
    setSaving(true); setError('');
    try {
      await api(`/employees/${employee.id}/face-enrollment`,
        {method: 'POST', body: {challengeId: challenge.challengeId}});
      onSaved(employee);
    } catch (err) {
      setError(err.message);
      if ([409, 410].includes(err.status)) setChallenge(null);
    } finally {setSaving(false);}
  }

  return <Modal title={employee.hasFaceData ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'}
    onClose={() => {reset(); onClose();}} busy={saving}>
    <p className="font-semibold">{employee.name} <span className="text-sm font-normal text-gray-500">· {employee.empId}</span></p>
    <p className="my-3 text-sm text-gray-500">Bắt đầu kiểm tra, sau đó nhìn thẳng và xoay nhẹ đầu theo hướng dẫn. Giữ cả hai mắt trong khung hình. Ảnh được kiểm tra tự động.</p>
    {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {!navigator.mediaDevices && <p role="alert" className="text-red-700">Camera cần truy cập bằng localhost hoặc HTTPS.</p>}
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
      <video ref={video} autoPlay playsInline muted onLoadedData={() => setReady(true)} className="h-full w-full object-cover -scale-x-100"/>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-3/4 w-1/2 rounded-[50%] border-2 border-white/80"/>
      </div>
    </div>
    <div role="status" aria-live="polite" className="mt-3 rounded-xl bg-blue-50 p-4 text-blue-900">
      <p className="font-semibold">{challenge ? instructions[challenge.pose] : 'Sẵn sàng kiểm tra chuyển động'}</p>
      {challenge && <>
        <p className="mt-1 text-sm">{challenge.complete ? '4/4 bước hoàn tất. Bạn có thể lưu khuôn mặt.' : `Bước ${challenge.step + 1}/4 · Giữ tư thế trong giây lát`}</p>
        <progress aria-label="Tiến độ kiểm tra khuôn mặt" value={challenge.step} max={4} className="mt-2 w-full"/>
        {challenge.message && <p className="mt-1 text-sm">{challenge.message}</p>}
      </>}
    </div>
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button disabled={saving} onClick={() => {reset(); onClose();}} className="rounded-xl border px-4 py-2">Hủy</button>
      {!ready && <button disabled={saving} onClick={() => {reset(); setReady(false); setRetry(x => x + 1);}} className="rounded-xl border px-4 py-2">Thử lại camera</button>}
      {running ? <button disabled={saving} onClick={reset} className="rounded-xl border px-4 py-2">Dừng kiểm tra</button>
        : <button disabled={saving || !ready} onClick={start} className="rounded-xl border border-blue-200 px-4 py-2 text-blue-600 disabled:opacity-50">{challenge ? 'Kiểm tra lại' : 'Bắt đầu kiểm tra'}</button>}
      <button disabled={saving || running || !challenge?.complete} onClick={save} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Đang đăng ký...' : 'Lưu khuôn mặt'}</button>
    </div>
  </Modal>;
}
