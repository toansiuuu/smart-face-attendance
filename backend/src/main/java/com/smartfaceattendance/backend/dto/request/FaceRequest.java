package com.smartfaceattendance.backend.dto.request;

import jakarta.validation.constraints.*;
import java.time.*;

public record FaceRequest(@NotBlank @Size(max = 2800000) String anhKhuonMat) {}
