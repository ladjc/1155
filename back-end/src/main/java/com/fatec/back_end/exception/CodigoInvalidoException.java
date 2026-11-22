package com.fatec.back_end.exception;

// Código de recuperação errado, expirado, já usado ou com tentativas esgotadas
public class CodigoInvalidoException extends RuntimeException {

    public CodigoInvalidoException(String mensagem) {
        super(mensagem);
    }
}
