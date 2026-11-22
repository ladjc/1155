package com.fatec.back_end.dto;

// Corpo esperado em POST /api/cliente/recuperar-senha/redefinir
// token: autorização devolvida ao confirmar o código
public record RedefinicaoSenhaRequest(String token, String novaSenha) {
}
