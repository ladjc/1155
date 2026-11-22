package com.fatec.back_end.dto;

// Corpo esperado em POST /api/cliente/recuperar-senha/verificar
public record VerificacaoEmailRequest(String email) {
}
