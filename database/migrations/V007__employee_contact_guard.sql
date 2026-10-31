CREATE TABLE IF NOT EXISTS employee_contact_guard (id int NOT NULL PRIMARY KEY);
INSERT INTO employee_contact_guard (id) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM employee_contact_guard WHERE id = 1);
-- Unique contact indexes are added idempotently by EmployeeContactConstraints.
-- Existing duplicates are retained; EmployeeService serializes contact writes using this row.
