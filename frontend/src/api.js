const base = import.meta.env.VITE_API_BASE_URL || '/api';
let csrf;
export async function api(path, options = {}) {
  const method = options.method || 'GET';
  if (!['GET','HEAD','OPTIONS'].includes(method) && !csrf) {
    const r = await fetch(base+'/auth/csrf', {credentials:'include'});
    if(!r.ok) throw new Error('Không lấy được CSRF token');
    csrf = await r.json();
  }
  const response = await fetch(base+path, {...options, credentials:'include', headers:{'Content-Type':'application/json', ...(csrf?{[csrf.headerName]:csrf.token}:{}), ...options.headers}, body:options.body === undefined ? undefined : JSON.stringify(options.body)});
  const data = await response.json().catch(()=>({}));
  if (!response.ok) {if(response.status===403)csrf=null; const error=new Error(data.message || `HTTP ${response.status}`); error.status=response.status; throw error;}
  if(['/auth/login','/auth/logout','/auth/password','/auth/password-recovery/reset'].includes(path))csrf=null;
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
export const attendanceRow=r=>({...r,date:r.date.split('-').reverse().join('/'),dept:r.dept||'—'});
export const correctionRow=r=>({...r,dateTarget:r.dateTarget.split('-').reverse().join('/'),scanType:labels[r.eventType],submitTime:r.submitTime.replace('T',' ')});
export async function logout(navigate){await api('/auth/logout',{method:'POST'});navigate('/login');}
