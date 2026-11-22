import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workingDaysError} from './src/workingDays.js';
import {employeeErrors, employeeUpdateErrors, passwordError, scheduleError} from './src/validation.js';
import {employeeProfile, employeeUpdateBody} from './src/employeeProfile.js';

const valid = {employeeCode:'NV01', fullName:'Nguyễn Văn An', email:'an@example.com', phone:'0912345678', password:'ValidPassword123', dateOfBirth:'2000-01-01'};
test('employee fields accept Vietnamese names and reject invalid/duplicate input', () => {
  assert.deepEqual(employeeErrors(valid), {});
  const errors = employeeErrors({...valid, employeeCode:'BAD CODE', fullName:'123', phone:'abcdef', email:'invalid', password:'short', dateOfBirth:'2999-01-01'});
  for (const key of ['employeeCode','fullName','phone','email','password','dateOfBirth']) assert.ok(errors[key]);
  const duplicate = employeeErrors(valid, [{empId:'nv01',email:'AN@example.com',phone:'0912345678'}]);
  for (const key of ['employeeCode','email','phone']) assert.ok(duplicate[key]);
});
test('password validation enforces bytes as well as length', () => {
  assert.equal(passwordError('ValidPassword123'), '');
  assert.ok(passwordError('short'));
  assert.ok(passwordError('ế'.repeat(30)));
});

test('profile edit permits own contacts and reactivation, rejects another employees contacts and invalid fields', () => {
  const employee = {id: 4, empId: 'NV01', name: valid.fullName, email: valid.email, phone: valid.phone, workStatus: 'Đã nghỉ việc'};
  const other = {id: 5, empId: 'NV02', email: 'second@example.com', phone: '0987654321'};
  const initial = employeeProfile(employee);
  assert.equal(initial.status, 'INACTIVE');
  assert.deepEqual(employeeUpdateErrors({...initial, status: 'ACTIVE'}, [employee, other], employee), {});
  const duplicate = employeeUpdateErrors({...initial, email: ' SECOND@example.com ', phone: '0987654321'}, [employee, other], employee);
  assert.ok(duplicate.email); assert.ok(duplicate.phone);
  const invalid = employeeUpdateErrors({...initial, fullName: '123', email: '', phone: 'abc', position: ' ', dateOfBirth: '2026-02-30', gender: 'UNKNOWN', status: 'INVALID'}, [employee, other], employee);
  for (const field of ['fullName', 'email', 'phone', 'position', 'dateOfBirth', 'gender', 'status']) assert.ok(invalid[field], field);
  assert.equal(invalid.password, undefined);
  assert.equal(invalid.employeeCode, undefined);
});

test('profile payload normalizes contacts, clears optional fields and never changes account identity', () => {
  const employee = {id: 4, empId: 'NV01', name: valid.fullName, email: valid.email, phone: valid.phone, workStatus: 'Đang làm việc'};
  const payload = employeeUpdateBody({...employeeProfile(employee), fullName: ' Nguyễn Văn An ', email: ' NEW@EXAMPLE.COM ', phone: ' 0912345678 ', position: ' Kỹ sư ', employeeCode: 'ATTACK', password: 'ChangedPassword123'});
  assert.deepEqual(payload, {fullName: 'Nguyễn Văn An', email: 'new@example.com', phone: '0912345678', position: 'Kỹ sư', dateOfBirth: null, gender: null, status: 'ACTIVE'});
  assert.equal(employeeUpdateBody({...employeeProfile(employee), phone: ''}).phone, null);
  const legacy = {...employee, email: 'shared@example.com'};
  assert.deepEqual(employeeUpdateErrors(employeeProfile(legacy), [legacy, {...employee, id: 6, email: legacy.email}], legacy), {});
});
test('schedule refuses overlapping windows and targets outside windows', () => {
  const schedule={workingDays:['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'],shiftCode:'STANDARD',shiftName:'Lịch chung',effectiveFrom:'2999-01-01',milestones:[{windowStart:'07:00',targetTime:'08:00',windowEnd:'10:00'}, {windowStart:'11:00',targetTime:'12:00',windowEnd:'12:30'}]};
  assert.equal(scheduleError(schedule,true),'');
  assert.ok(scheduleError({...schedule,milestones:[schedule.milestones[0],{windowStart:'09:00',targetTime:'12:00',windowEnd:'13:00'}]},true));
  assert.ok(scheduleError({...schedule,milestones:[{windowStart:'09:00',targetTime:'08:00',windowEnd:'10:00'}]},true));
});

test('working weekdays require an explicit valid nonduplicated selection', () => {
 assert.ok(workingDaysError([]));
 assert.ok(workingDaysError(['MONDAY','MONDAY']));
 assert.ok(workingDaysError(['FUNDAY']));
 assert.equal(workingDaysError(['SATURDAY','SUNDAY']), '');
 assert.equal(workingDaysError(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']), '');
});
