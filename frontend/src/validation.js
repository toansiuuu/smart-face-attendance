import {localDay} from './api.js';
import {workingDaysError} from './workingDays.js';
export const passwordError = value => value.length < 12 ? 'Mật khẩu cần ít nhất 12 ký tự.' : new TextEncoder().encode(value).length > 72 ? 'Mật khẩu không được vượt quá 72 byte UTF-8.' : '';
export const nameError = value => value.trim().length < 2 || value.length > 150 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(value.trim()) ? 'Họ tên cần 2–150 ký tự, chỉ gồm chữ và dấu cách/chấm/gạch nối.' : '';
function profileErrors(value, employees = [], current = null) {
 const errors = {};
 const email=(value.email || '').trim().toLowerCase(), phone=(value.phone || '').trim();
 if(nameError(value.fullName || '')) errors.fullName=nameError(value.fullName || '');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>255) errors.email='Nhập email hợp lệ, tối đa 255 ký tự.';
 if(phone && !/^0[0-9]{9,10}$/.test(phone)) errors.phone='Số điện thoại cần 10–11 chữ số, bắt đầu bằng 0.';
 if(value.position && (value.position.length>100 || !value.position.trim())) errors.position='Chức vụ cần từ 1 đến 100 ký tự khi được điền.';
 if(value.gender && !['MALE','FEMALE','OTHER'].includes(value.gender)) errors.gender='Giới tính không hợp lệ.';
 if(value.dateOfBirth){const today=localDay(); const birth=new Date(value.dateOfBirth+'T00:00:00Z'); let age=Number(today.slice(0,4))-birth.getUTCFullYear(); if(today.slice(5)<value.dateOfBirth.slice(5))age--; if(!/^\d{4}-\d{2}-\d{2}$/.test(value.dateOfBirth) || !Number.isFinite(birth.getTime()) || birth.toISOString().slice(0,10)!==value.dateOfBirth || value.dateOfBirth>=today || age<16 || age>120)errors.dateOfBirth='Tuổi nhân viên phải từ 16 đến 120, ngày sinh phải hợp lệ.';}
 const others = current ? employees.filter(e=>String(e.id)!==String(current.id)) : employees;
 // Match the server: unchanged legacy contacts do not block unrelated edits.
 if((!current || email!==(current.email || '').trim().toLowerCase()) && others.some(e=>e.email?.trim().toLowerCase()===email)) errors.email='Email đã được sử dụng.';
 if(phone && (!current || phone!==(current.phone || '').trim()) && others.some(e=>(e.phone || '').trim()===phone)) errors.phone='Số điện thoại đã được sử dụng.';
 return errors;
}
export function employeeErrors(value, employees = []) {
 const errors = profileErrors(value, employees);
 const code=(value.employeeCode || '').trim();
 if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(code)) errors.employeeCode='Mã nhân viên cần 1–32 ký tự chữ/số, gạch ngang hoặc gạch dưới.';
 if(employees.some(e=>e.empId.toLowerCase()===code.toLowerCase())) errors.employeeCode='Mã nhân viên đã tồn tại.';
 if(passwordError(value.password || '')) errors.password=passwordError(value.password || '');
 return errors;
}
export function employeeUpdateErrors(value, employees, current) {
 const errors = profileErrors(value, employees, current);
 if(!['ACTIVE','INACTIVE'].includes(value.status)) errors.status='Chọn trạng thái nhân viên hợp lệ.';
 return errors;
}
export function scheduleError(schedule, hasSchedule) {
 const daysError = workingDaysError(schedule.workingDays);
 if(daysError) return daysError;
 if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(schedule.shiftCode.trim()))return 'Mã lịch cần 1–32 ký tự chữ/số, gạch ngang hoặc gạch dưới.';
 if(!schedule.shiftName.trim() || schedule.shiftName.length>120)return 'Tên lịch cần 1–120 ký tự.';
 if(!schedule.effectiveFrom || (hasSchedule && schedule.effectiveFrom<=localDay()))return 'Phiên bản lịch mới cần ngày hiệu lực sau hôm nay.';
 let previous='';
 for(const m of schedule.milestones){if(!m.windowStart || !m.targetTime || !m.windowEnd || m.windowStart>m.targetTime || m.targetTime>m.windowEnd)return 'Giờ chuẩn phải nằm trong khoảng mở/đóng của từng mốc.';if(previous && m.windowStart<=previous)return 'Các cửa sổ chấm công phải theo thứ tự và không chồng lấn.';previous=m.windowEnd;}
 return '';
}
