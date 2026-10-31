package com.smartfaceattendance.backend.config;

import java.time.Clock;
import java.util.concurrent.Executor;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class RecoveryConfig {
  @Bean public Clock recoveryClock() { return Clock.systemUTC(); }
  @Bean(name = "recoveryExecutor") public Executor recoveryExecutor() {
    var executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(2);
    executor.setQueueCapacity(50);
    executor.setThreadNamePrefix("password-recovery-");
    executor.initialize();
    return executor;
  }
}
