package com.fatec.back_end.dto;

// Corpo esperado em POST /api/cliente/login
public record LoginRequest(String email, String senha) {
}
