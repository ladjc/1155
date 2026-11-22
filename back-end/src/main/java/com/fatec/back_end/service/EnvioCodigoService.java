package com.fatec.back_end.service;

/**
 * Envia o código de recuperação de senha ao cliente. Implementações:
 *  - {@link EnvioCodigoLog}: mostra o código no console (EMAIL_MODO=log, padrão);
 *  - {@link EnvioCodigoEmail}: envia por e-mail via SMTP/Mailtrap (EMAIL_MODO=smtp).
 */
public interface EnvioCodigoService {

    void enviar(String email, String nome, String codigo);
}
