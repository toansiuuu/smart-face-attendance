CREATE TABLE IF NOT EXISTS shift_working_day_policy (
 shift_id bigint NOT NULL PRIMARY KEY,
 working_days varchar(80) NOT NULL,
 CONSTRAINT fk_working_day_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);
