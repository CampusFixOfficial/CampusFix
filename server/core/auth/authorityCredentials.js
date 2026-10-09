function verifyAuthorityCredentials(user, employeeId, departmentName) {
  const submittedEmployeeId = String(employeeId || '').trim().toUpperCase();
  const assignedEmployeeId = String(user?.employeeId || '').trim().toUpperCase();
  const submittedDepartment = String(departmentName || '').trim().toLowerCase();
  const assignedDepartment = String(user?.department?.name || '').trim().toLowerCase();

  return Boolean(
    submittedEmployeeId &&
    assignedEmployeeId &&
    submittedEmployeeId === assignedEmployeeId &&
    submittedDepartment &&
    assignedDepartment &&
    submittedDepartment === assignedDepartment
  );
}

module.exports = { verifyAuthorityCredentials };
