package com.smartfaceattendance.backend.service;

import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.HexFormat;

public record AccountPrincipal(String username, String passwordFingerprint) implements Principal, Serializable {
  @Override public String getName() { return username; }

  public static String fingerprint(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
  }
}
