package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
