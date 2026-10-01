package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record ReviewRequest(@NotNull Boolean approve, @Size(max = 500) String note) {}
