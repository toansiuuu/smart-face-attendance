package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.entity.Account;
import com.smartfaceattendance.backend.exception.ApiException;
import com.smartfaceattendance.backend.repository.CorrectionRepository;
import java.io.IOException;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CorrectionAttachments {
  private final JdbcTemplate jdbc;
  private final CorrectionRepository corrections;
  public CorrectionAttachments(JdbcTemplate jdbc, CorrectionRepository corrections) {
    this.jdbc = jdbc; this.corrections = corrections;
  }
  public record Upload(String name, String type, byte[] data) {}
  public List<Upload> validate(List<MultipartFile> files) {
    if (files.size() > 3) throw new ApiException(400, "Chỉ được đính kèm tối đa 3 tệp.");
    var result = new ArrayList<Upload>();
    for (var file : files) {
      if (file.isEmpty() || file.getSize() > 2_000_000)
        throw new ApiException(400, "Mỗi tệp phải có dữ liệu và không vượt quá 2 MB.");
      try {
        byte[] data = file.getBytes();
        String type;
        if (data.length >= 8 && Arrays.equals(Arrays.copyOf(data, 8), new byte[]{(byte)137,80,78,71,13,10,26,10})) type = "image/png";
        else if (data.length >= 3 && data[0] == (byte)255 && data[1] == (byte)216 && data[2] == (byte)255) type = "image/jpeg";
        else if (data.length >= 5 && new String(data, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-")) type = "application/pdf";
        else throw new ApiException(400, "Chỉ chấp nhận ảnh PNG, JPEG hoặc PDF.");
        if (type.startsWith("image/")) ImageValidation.type(data);
        String name = Optional.ofNullable(file.getOriginalFilename()).orElse("attachment")
            .replaceAll("[\\\\/\\p{Cntrl}]", "_");
        if (name.length() > 180) name = name.substring(name.length() - 180);
        result.add(new Upload(name, type, data));
      } catch (IOException e) { throw new ApiException(400, "Không đọc được tệp đính kèm."); }
    }
    return result;
  }
  public void save(Long correctionId, List<Upload> files) {
    for (var file : files) jdbc.update("INSERT INTO correction_attachments (id, correction_id, file_name, content_type, content) VALUES (?, ?, ?, ?, ?)",
        UUID.randomUUID().toString(), correctionId, file.name(), file.type(), file.data());
  }
  public List<Map<String, Object>> list(Long id) {
    return jdbc.query("SELECT id, file_name FROM correction_attachments WHERE correction_id = ? ORDER BY id",
        (rs, row) -> Map.<String, Object>of("id", rs.getString(1), "name", rs.getString(2), "url", "/api/corrections/" + id + "/attachments/" + rs.getString(1)), id);
  }
  public Upload download(Account user, Long correctionId, String attachmentId) {
    var correction = corrections.findById(correctionId).orElseThrow(() -> new ApiException(404, "Không tìm thấy yêu cầu."));
    if (!"MANAGER".equals(user.role) && !Objects.equals(user.employeeId, correction.employeeId))
      throw new ApiException(403, "Bạn không có quyền xem tệp này.");
    return jdbc.query("SELECT file_name, content_type, content FROM correction_attachments WHERE id = ? AND correction_id = ?",
        (rs, row) -> new Upload(rs.getString(1), rs.getString(2), rs.getBytes(3)), attachmentId, correctionId)
        .stream().findFirst().orElseThrow(() -> new ApiException(404, "Không tìm thấy tệp."));
  }
}
