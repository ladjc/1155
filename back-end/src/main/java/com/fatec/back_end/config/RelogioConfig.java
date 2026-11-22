package com.fatec.back_end.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RelogioConfig {

    // Relógio usado nos prazos de validade (permite controlar o tempo nos testes)
    @Bean
    public Clock relogio() {
        return Clock.systemDefaultZone();
    }
}
