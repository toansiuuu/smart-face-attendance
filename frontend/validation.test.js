import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workingDaysError} from './src/workingDays.js';
import {employeeErrors, passwordError, scheduleError} from './src/validation.js';

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
