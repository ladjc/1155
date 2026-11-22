package com.fatec.back_end.dto;

// Corpo esperado em POST /api/cliente/recuperar-senha/confirmar
public record ConfirmacaoCodigoRequest(String email, String codigo) {
}
