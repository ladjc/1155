package com.fatec.back_end.dto;

import com.fatec.back_end.model.Cliente;

// O que o back-end devolve sobre o cliente: nunca inclui a senha
public record ClienteResponse(Integer id, String nome, String email, String telefone, String documento,
        String endereco) {

    public static ClienteResponse de(Cliente cliente) {
        return new ClienteResponse(cliente.getId(), cliente.getNome(), cliente.getEmail(), cliente.getTelefone(),
                cliente.getDocumento(), cliente.getEndereco());
    }
}
