package com.fatec.back_end.exception;

// O servidor de e-mail (ex.: Mailtrap) não aceitou ou não respondeu ao envio
public class EnvioEmailException extends RuntimeException {

    public EnvioEmailException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
