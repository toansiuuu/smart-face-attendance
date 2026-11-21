CREATE TABLE IF NOT EXISTS correction_attachments (
 id varchar(36) NOT NULL PRIMARY KEY,
 correction_id bigint NOT NULL,
 file_name varchar(180) NOT NULL,
 content_type varchar(80) NOT NULL,
 content longblob NOT NULL,
 CONSTRAINT fk_correction_attachment FOREIGN KEY (correction_id) REFERENCES correction_requests(id) ON DELETE CASCADE
);
