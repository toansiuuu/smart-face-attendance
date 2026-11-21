import {afterEach, test} from 'node:test';
import assert from 'node:assert/strict';
import {api, summarizeAttendance} from './src/api.js';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json'}});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test('network failure is actionable and mutations are not retried', async () => {
  let calls=0;
  globalThis.fetch=async()=>{calls++;throw new TypeError('network failure');};
  await assert.rejects(api('/employees',{method:'POST',body:{}}), /Không kết nối được máy chủ/);
  assert.equal(calls,1);
});

test('multipart keeps native boundary and current CSRF token', async () => {
  const body=new FormData(); body.append('files',new Blob(['test']),'test.txt');
  globalThis.fetch=async(url, options)=>{
    if(url.endsWith('/auth/csrf')) return json({headerName:'X-CSRF-TOKEN',token:'test-token'});
    assert.equal(options.body,body);
    assert.equal(options.headers['Content-Type'],undefined);
    assert.equal(options.headers['X-CSRF-TOKEN'],'test-token');
    assert.equal(options.credentials,'include');
    return json({saved:true});
  };
  assert.deepEqual(await api('/corrections',{method:'post',body}),{saved:true});
});

test('aborted camera request also aborts CSRF fetch', async () => {
  const controller=new AbortController(); controller.abort();
  let calls=0;
  globalThis.fetch=async(url, options)=>{
    calls++;assert.equal(options.signal,controller.signal);
    throw new DOMException('aborted','AbortError');
  };
  await assert.rejects(api('/diem-danh',{method:'POST',signal:controller.signal,body:{}}),error=>error.name==='AbortError');
  assert.equal(calls,1);
});

test('expired session notifies protected views but failed login does not', async () => {
  const events=[];
  globalThis.window={dispatchEvent:event=>events.push(event.type)};
  globalThis.fetch=async(url)=>url.endsWith('/auth/csrf')?json({headerName:'X-CSRF-TOKEN',token:'test'}):json({message:'Unauthorized'},401);
  await assert.rejects(api('/employees'),error=>error.status===401);
  await assert.rejects(api('/auth/login',{method:'POST',body:{}}),error=>error.status===401);
  assert.deepEqual(events,['auth-expired']);
});

test('successful HTML response cannot masquerade as valid API JSON', async () => {
  globalThis.fetch=async()=>new Response('<html>proxy error</html>',{status:200});
  await assert.rejects(api('/auth/me'), /dữ liệu không hợp lệ/);
});

test('monthly absence uses each historical row rather than todays calendar', () => {
 const result=summarizeAttendance([{workingDaysConfigured:true,status:'Vắng mặt'}, {workingDaysConfigured:true,status:'Ngày nghỉ'}, {workingDaysConfigured:false,status:'Chưa có dữ liệu'}]);
 assert.deepEqual(result,{total:3,absent:1,unconfigured:1});
 assert.deepEqual(summarizeAttendance([]),{total:0,absent:0,unconfigured:0});
});
