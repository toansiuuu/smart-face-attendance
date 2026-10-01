# Verification — UI revision, 1 October 2026

## Passed

- Backend clean build/test: **18 tests, 0 failures, 0 errors**. Includes public attendance with real anonymous CSRF token, management access denial, manager-only enrollment, session login, password validation paths exercised by the browser, ownership, duplicate scans and concurrent correction review.
- Frontend `npm run lint` and `npm run build` passed. Existing ExcelJS eval and bundle-size warnings remain.
- Chromium against the running React/Spring Boot application: manager profile password dialog; schedule creation from the sidebar; employee creation; enrollment from that employee's row; status refresh; camera tracks stopped on save and cancel; successful public camera request without login; protected management API denied to the camera session; employee profile password change followed by login with the new password. No JavaScript page errors.
- The supplied database SQL reference remains byte-for-byte unchanged.

## Verification boundary

Automated tests and browser flows used a temporary H2 database in MySQL compatibility mode, not your local MySQL. No data on your machine was accessed or modified.

Browser tests injected a synthetic camera stream and used a local recognition stub ONLY inside the test environment. No fake provider or camera is bundled into the application. These tests establish UI/API integration, not live biometric accuracy or liveness. The missing-provider path is tested to return an error without recording attendance.

Your configured MySQL, real camera and face service must still be verified on your machine. Database mapping and tables are unchanged from the prior delivery. No production deployment was performed.

One negative test deliberately violates the employee-account CHECK constraint, so its expected SQL error can appear in the test log even though all tests pass.
