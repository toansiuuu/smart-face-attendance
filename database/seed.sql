-- Seed MANAGER account: admin / admin1234567890
INSERT IGNORE INTO user_accounts (username, password_hash, role, enabled, created_at)
VALUES ('admin', '$2b$10$zQa8qtb11iaoxYt1d5IJ/OFnd6fWz/z.JeWpjHXFI59GdOiJu06ze', 'MANAGER', 1, NOW(3));
