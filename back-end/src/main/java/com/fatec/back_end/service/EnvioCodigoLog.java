package com.fatec.back_end.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Implementação padrão (EMAIL_MODO=log): o código aparece no console (log) do
 * back-end, para testar sem servidor de e-mail. Com EMAIL_MODO=smtp, a classe
 * {@link EnvioCodigoEmail} passa a ser usada no lugar desta.
 */
@Service
public class EnvioCodigoLog implements EnvioCodigoService {

    private static final Logger log = LoggerFactory.getLogger(EnvioCodigoLog.class);

    @Override
    public void enviar(String email, String nome, String codigo) {
        log.warn("[RECUPERAÇÃO DE SENHA] EMAIL_MODO=log (e-mail não enviado). Código para {} ({}): {}",
                email, nome, codigo);
    }
}
