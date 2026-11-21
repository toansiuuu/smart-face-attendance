export const weekdays = [
 {value:'MONDAY', label:'Thứ Hai'}, {value:'TUESDAY', label:'Thứ Ba'},
 {value:'WEDNESDAY', label:'Thứ Tư'}, {value:'THURSDAY', label:'Thứ Năm'},
 {value:'FRIDAY', label:'Thứ Sáu'}, {value:'SATURDAY', label:'Thứ Bảy'}, {value:'SUNDAY', label:'Chủ nhật'},
];
export function workingDaysError(days) {
 if (!Array.isArray(days) || !days.length) return 'Chọn ít nhất một ngày làm việc.';
 if (days.length>7 || new Set(days).size!==days.length || days.some(day=>!weekdays.some(item=>item.value===day))) return 'Danh sách ngày làm việc không hợp lệ.';
 return '';
}
export const workingDaysLabel = days => weekdays.filter(day=>(days || []).includes(day.value)).map(day=>day.label).join(', ');
