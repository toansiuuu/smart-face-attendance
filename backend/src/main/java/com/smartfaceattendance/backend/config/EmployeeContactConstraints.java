package com.smartfaceattendance.backend.config;

import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Adds contact uniqueness to existing databases without deleting employee data. */
@Component
public class EmployeeContactConstraints implements ApplicationRunner {
  private final DataSource source;
  private final JdbcTemplate jdbc;

  public EmployeeContactConstraints(DataSource source, JdbcTemplate jdbc) {
    this.source = source;
    this.jdbc = jdbc;
  }

  @Override
  public void run(ApplicationArguments args) throws SQLException {
    for (String column : new String[] {"email", "phone"}) {
      String index = "uq_employees_" + column;
      boolean exists = false;
      try (var connection = source.getConnection();
          var indexes = connection.getMetaData().getIndexInfo(connection.getCatalog(), null, "employees", true, false)) {
        while (indexes.next()) {
          if (index.equalsIgnoreCase(indexes.getString("INDEX_NAME"))) exists = true;
        }
      }
      if (exists) continue;
      // Check first: existing duplicates need an explicit administrative correction.
      Long duplicates = jdbc.queryForObject("SELECT COUNT(*) FROM (SELECT LOWER(TRIM(" + column
          + ")) FROM employees WHERE NULLIF(TRIM(" + column + "), '') IS NOT NULL"
          + " GROUP BY LOWER(TRIM(" + column + ")) HAVING COUNT(*) > 1) duplicates", Long.class);
      if (duplicates != null && duplicates > 0) {
        org.slf4j.LoggerFactory.getLogger(getClass()).warn(
            "Existing duplicate employee {} values: unique index deferred; serialized contact validation remains active. Correct existing profiles and restart to add the index.", column);
        continue;
      }
      jdbc.update("UPDATE employees SET " + column + " = NULLIF(LOWER(TRIM(" + column + ")), '')");
      jdbc.execute("CREATE UNIQUE INDEX " + index + " ON employees (" + column + ")");
    }
  }
}
