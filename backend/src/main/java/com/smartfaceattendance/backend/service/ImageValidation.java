package com.smartfaceattendance.backend.service;

import com.smartfaceattendance.backend.exception.ApiException;
import java.io.*;
import java.util.Locale;
import javax.imageio.ImageIO;

/** Validate actual image contents before decoding or publishing uploaded files. */
public final class ImageValidation {
  private ImageValidation() {}

  public static String type(byte[] data) {
    if (data.length == 0 || data.length > 2_000_000) throw new ApiException(400, "Ảnh phải có dữ liệu và không vượt quá 2 MB.");
    try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(data))) {
      var readers = ImageIO.getImageReaders(input);
      if (!readers.hasNext()) throw new ApiException(400, "Ảnh không hợp lệ; chỉ chấp nhận PNG hoặc JPEG.");
      var reader = readers.next();
      try {
        String format = reader.getFormatName().toLowerCase(Locale.ROOT);
        if (!format.equals("png") && !format.equals("jpeg")) throw new ApiException(400, "Chỉ chấp nhận PNG hoặc JPEG.");
        reader.setInput(input);
        long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
        if (pixels <= 0 || pixels > 12_000_000) throw new ApiException(400, "Ảnh tối đa 12 triệu điểm ảnh.");
        if (reader.read(0) == null) throw new ApiException(400, "Tệp ảnh không hợp lệ.");
        return "image/" + format;
      } finally { reader.dispose(); }
    } catch (IOException | IllegalArgumentException e) {
      throw new ApiException(400, "Không đọc được tệp ảnh.");
    }
  }
}
