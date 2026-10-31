CREATE TABLE IF NOT EXISTS password_reset_requests (
  id varchar(36) NOT NULL PRIMARY KEY,
  account_id bigint DEFAULT NULL,
  subject_hash varchar(64) NOT NULL,
  requester_hash varchar(64) NOT NULL,
  channel varchar(5) NOT NULL,
  destination_hash varchar(64) NOT NULL,
  password_fingerprint varchar(64) NOT NULL,
  code_hash varchar(100) NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  created_at datetime(3) NOT NULL,
  expires_at datetime(3) NOT NULL,
  INDEX ix_reset_subject_created (subject_hash, created_at),
  INDEX ix_reset_requester_created (requester_hash, created_at),
  INDEX ix_reset_created (created_at),
  CONSTRAINT fk_reset_account FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE SET NULL
);
