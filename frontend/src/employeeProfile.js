export function employeeProfile(employee) {
  return {
    fullName: employee.name, email: employee.email || '', phone: employee.phone || '',
    position: employee.position || '', dateOfBirth: employee.dateOfBirth || '', gender: employee.gender || '',
    status: employee.workStatus === 'Đang làm việc' ? 'ACTIVE' : 'INACTIVE',
  };
}

export function employeeUpdateBody(value) {
  // Keep employee ID, login name, face and password outside the editable profile.
  return {
    fullName: value.fullName.trim(), email: value.email.trim().toLowerCase(),
    phone: value.phone.trim() || null, position: value.position.trim() || null,
    dateOfBirth: value.dateOfBirth || null, gender: value.gender || null, status: value.status,
  };
}
