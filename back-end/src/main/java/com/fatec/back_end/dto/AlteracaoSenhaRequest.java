package com.fatec.back_end.dto;

// Corpo esperado em PUT /api/cliente/{id}/senha
public record AlteracaoSenhaRequest(String senhaAtual, String novaSenha) {
}
