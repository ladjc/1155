package com.fatec.back_end.service;

import java.io.UnsupportedEncodingException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.fatec.back_end.exception.EnvioEmailException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Envia o código de recuperação por e-mail via SMTP (ex.: Mailtrap).
 * Só é ativada com app.email.modo=smtp (EMAIL_MODO=smtp no .env); nesse caso,
 * por ser @Primary, é usada no lugar de {@link EnvioCodigoLog}.
 */
@Service
@Primary
@ConditionalOnProperty(name = "app.email.modo", havingValue = "smtp")
public class EnvioCodigoEmail implements EnvioCodigoService {

    private static final Logger log = LoggerFactory.getLogger(EnvioCodigoEmail.class);
    static final String ASSUNTO = "Seu código de recuperação de senha - ExtraTechRestre";

    private final JavaMailSender mailSender;
    private final String remetente;
    private final String nomeRemetente;

    public EnvioCodigoEmail(JavaMailSender mailSender,
            @Value("${app.email.remetente}") String remetente,
            @Value("${app.email.nome-remetente}") String nomeRemetente) {
        this.mailSender = mailSender;
        this.remetente = remetente;
        this.nomeRemetente = nomeRemetente;
    }

    @Override
    public void enviar(String email, String nome, String codigo) {
        try {
            MimeMessage mensagem = mailSender.createMimeMessage();
            // true = mensagem com versão em texto puro e em HTML
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");
            helper.setFrom(remetente, nomeRemetente);
            helper.setTo(email);
            helper.setSubject(ASSUNTO);
            helper.setText(textoSimples(nome, codigo), html(nome, codigo));
            mailSender.send(mensagem);
            log.info("[RECUPERAÇÃO DE SENHA] Código enviado por e-mail para {}", email);
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            log.error("[RECUPERAÇÃO DE SENHA] Falha ao enviar e-mail para {}: {}", email, e.getMessage());
            throw new EnvioEmailException("Não foi possível enviar o e-mail agora. Tente novamente em instantes.", e);
        }
    }

    private String primeiroNome(String nome) {
        return nome == null || nome.isBlank() ? "cliente" : nome.trim().split("\\s+")[0];
    }

    String textoSimples(String nome, String codigo) {
        return "Olá, " + primeiroNome(nome) + "!\n\n"
                + "Recebemos um pedido para redefinir a senha da sua conta na ExtraTechRestre.\n\n"
                + "Seu código de recuperação é: " + codigo + "\n\n"
                + "Ele vale por " + RecuperacaoSenhaService.VALIDADE_CODIGO_MINUTOS + " minutos.\n"
                + "Se não foi você que pediu, ignore este e-mail: a sua senha continua a mesma.";
    }

    // HTML com as cores do site (fundo escuro, verde #59a403)
    String html(String nome, String codigo) {
        return """
                <div style="font-family: Arial, Helvetica, sans-serif; background-color: #000; padding: 24px;">
                  <div style="max-width: 480px; margin: 0 auto; background-color: #212529; color: #fff;
                              border: 2px solid #59a403; border-radius: 8px; padding: 24px;">
                    <h2 style="margin-top: 0; border-left: 4px solid #59a403; padding-left: 10px;">ExtraTechRestre</h2>
                    <p>Olá, %s!</p>
                    <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
                    <p>Digite o código abaixo na tela de recuperação de senha:</p>
                    <p style="font-size: 34px; font-weight: bold; letter-spacing: 8px; text-align: center;
                              color: #85e903; background-color: #2b3035; border-radius: 8px; padding: 12px;">%s</p>
                    <p>O código vale por <b>%d minutos</b>.</p>
                    <p style="color: #adb5bd; font-size: 13px;">Se não foi você que pediu, ignore este e-mail:
                       a sua senha continua a mesma.</p>
                  </div>
                </div>
                """.formatted(primeiroNome(nome), codigo, RecuperacaoSenhaService.VALIDADE_CODIGO_MINUTOS);
    }
}
