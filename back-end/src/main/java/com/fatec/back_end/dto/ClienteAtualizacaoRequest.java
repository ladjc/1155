package com.fatec.back_end.dto;

/**
 * Corpo esperado em PUT /api/cliente/{id} (alterar cadastro).
 * Nome, telefone e endereço podem mudar livremente. senhaAtual só é exigida
 * quando o e-mail ou o documento forem alterados. A senha em si é trocada em
 * PUT /api/cliente/{id}/senha.
 */
public record ClienteAtualizacaoRequest(String nome, String email, String telefone, String documento,
        String endereco, String senhaAtual) {
}
