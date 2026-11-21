const base = import.meta.env?.VITE_API_BASE_URL || '/api';
async function send(url, options) {
  try {return await fetch(url, options);} catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Không kết nối được máy chủ. Kiểm tra kết nối và thử lại.', {cause:error});
  }
}
export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let csrf;
  if (!['GET','HEAD','OPTIONS'].includes(method)) {
    const r = await send(base+'/auth/csrf', {credentials:'include', signal:options.signal});
    if(!r.ok) throw new Error('Không lấy được CSRF token');
    csrf = await r.json();
    if (!csrf.token || !csrf.headerName) throw new Error('Phiên bảo mật không hợp lệ. Hãy tải lại trang.');
  }
  const response = await send(base+path, {...options, method, credentials:'include', headers:{...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...(csrf?{[csrf.headerName]:csrf.token}:{}), ...options.headers}, body:options.body === undefined ? undefined : options.body instanceof FormData ? options.body : JSON.stringify(options.body)});
  const data = response.status === 204 ? {} : await response.json().catch(()=>null);
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && typeof window !== 'undefined') window.dispatchEvent(new Event('auth-expired'));
    const error=new Error(data?.message || (response.status === 401 ? 'Phiên đăng nhập đã hết hạn.' : `HTTP ${response.status}`));
    error.status=response.status; error.fields=data?.fields; throw error;
  }
  if (data === null) throw new Error('Máy chủ trả về dữ liệu không hợp lệ. Hãy thử lại.');
  return data;
}
export async function allPages(path) {
  let page=0, result=[];
  while(true){const data=await api(`${path}${path.includes('?')?'&':'?'}page=${page++}&size=200`);result.push(...data.items);if(result.length>=data.total||!data.items.length)return result;}
}
export const labels={MORNING_IN:'Giờ vào (Sáng)',LUNCH_OUT:'Giờ ra (Trưa)',AFTERNOON_IN:'Giờ vào (Chiều)',WORK_OUT:'Giờ ra (Chiều)'};
export const eventType=label=>Object.keys(labels).find(k=>labels[k]===label);
export const localDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const currentMonth=()=>{const [y,m]=localDay().split('-');return `${Number(m)}/${y}`;};
export const months=()=>Array.from({length:24},(_,i)=>{const [y,m]=localDay().split('-');const d=new Date(Number(y),Number(m)-1-i,1);return `${d.getMonth()+1}/${d.getFullYear()}`;});
export function monthRange(value){const [m,y]=value.split('/').map(Number);return {from:`${y}-${String(m).padStart(2,'0')}-01`,to:`${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}`};}
export const attendanceRow=r=>({...r,date:r.date.split('-').reverse().join('/')});
export const correctionRow=r=>({...r,dateTarget:r.dateTarget.split('-').reverse().join('/'),scanType:labels[r.eventType],submitTime:r.submitTime.replace('T',' ')});
export async function logout(navigate){await api('/auth/logout',{method:'POST'});navigate('/login');}

export function summarizeAttendance(rows) {
  return {total:rows.length, absent:rows.filter(row=>row.workingDaysConfigured && row.status==='Vắng mặt').length,
    unconfigured:rows.filter(row=>!row.workingDaysConfigured).length};
}
