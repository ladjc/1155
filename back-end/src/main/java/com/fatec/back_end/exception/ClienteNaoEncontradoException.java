package com.fatec.back_end.exception;

public class ClienteNaoEncontradoException extends RuntimeException {

    public ClienteNaoEncontradoException() {
        super("Cliente não encontrado.");
    }

    public ClienteNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
