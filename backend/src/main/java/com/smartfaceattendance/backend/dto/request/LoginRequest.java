package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record LoginRequest(@NotBlank @Size(max = 80) String username, @NotBlank @Size(max = 72) String password) {}
