# Database decisions — no changes executed

The original seven-table schema is the authority. JPA entities map its names, types and enum values. Foreign keys are represented by scalar `Long` ids in Java and remain enforced by MySQL. API responses use DTOs/maps, never password-bearing account entities.

| Existing table | Backend use |
|---|---|
| employees | Employee code, full name, ACTIVE/INACTIVE and creation time |
| user_accounts | BCrypt hash, MANAGER/EMPLOYEE, enabled and employee link |
| face_enrollments | Provider external reference and model version; one active enrollment per employee |
| shifts | Shared schedule versions selected by effective_from |
| shift_milestones | Four ordered target times and scan windows per schedule |
| attendance_events | Original immutable scans, unique by employee/date/milestone |
| correction_requests | Proposed correction, approval status, requester and reviewer |

No extra table is necessary for the delivered core flows. Session state is in server memory. Schedule versions use existing tables; there is no assignment table because all employees share the same schedule.

## Options requiring your approval

These are proposals, not migrations. No DDL was generated or executed for them.

| Missing feature | Possible change | Why / current behavior |
|---|---|---|
| Employee phone | Add nullable phone column to employees | Store phone numbers; currently disabled in UI. No new table needed. |
| Department | Add a departments table and employees.department_id, or a simple text column if only labels are needed | Real filtering/grouping; currently unavailable. Choose based on whether departments need management. |
| Correction attachments | Add correction_attachments with request id, storage key, type and size | Associate multiple uploaded files with a request. Binary files would live in controlled file/object storage. Upload currently disabled. |
| Holidays/approved leave | Model holiday calendar and leave records after agreeing rules | Reliable absence/payroll reporting; currently not claimed. |
| Login/activity audit | Separate audit records if required | Durable trace of actions beyond correction review. Not implemented. |

We should agree on each feature and its exact schema before adding it. Do not store missing fields in unrelated columns or pretend a save succeeded.

## Limits that matter for reports

- Changing working weekdays or grace minutes changes classification of past days: there is no versioned policy table.
- Current employee status has no historical timeline. Inactive employees with existing scans/corrections still appear; missing historical employment dates cannot be reconstructed.
- Reports produce days from the employee's recorded creation date through today, not future attendance.
- The latest applicable schedule is used unless an event/approved correction already anchors a day's schedule.
- Approved corrections are ordered by review timestamp and id; the latest approved value wins for a milestone. The raw scan stays untouched.
- The displayed status has precedence: missing data, then late, then early, then complete/on-time. A late-but-incomplete day is shown as incomplete, not counted by the UI's “Đi muộn” status counter.
- Worked minutes sum valid morning and afternoon pairs. They exclude lunch, do not imply payroll eligibility, and cannot prove the employee remained on site between scans.
