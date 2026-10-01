import {useEffect, useRef} from 'react';

export default function Modal({title, children, onClose, busy = false}) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} aria-label={title}
    onCancel={event => {event.preventDefault(); if (!busy) onClose();}}
    className="m-auto w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50">
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <button type="button" aria-label="Đóng" disabled={busy} onClick={onClose}
        className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-gray-100 disabled:opacity-40">×</button>
    </div>
    <div className="p-6">{children}</div>
  </dialog>;
}
