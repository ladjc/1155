package com.fatec.back_end.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayOutputStream;
import java.util.Properties;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import com.fatec.back_end.exception.EnvioEmailException;

import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

class EnvioCodigoEmailTest {

    private JavaMailSender mailSender;
    private EnvioCodigoEmail envio;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenAnswer(inv -> new MimeMessage(Session.getInstance(new Properties())));
        envio = new EnvioCodigoEmail(mailSender, "nao-responda@extratechrestre.com.br", "ExtraTechRestre");
    }

    @Test
    void enviaEmailComOCodigoParaOCliente() throws Exception {
        envio.enviar("maria@teste.com", "Maria Souza", "123456");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        MimeMessage msg = captor.getValue();
        msg.saveChanges();

        assertEquals("maria@teste.com", msg.getAllRecipients()[0].toString());
        assertEquals("nao-responda@extratechrestre.com.br", ((InternetAddress) msg.getFrom()[0]).getAddress());
        assertEquals(EnvioCodigoEmail.ASSUNTO, msg.getSubject());

        ByteArrayOutputStream conteudo = new ByteArrayOutputStream();
        msg.writeTo(conteudo);
        String texto = conteudo.toString();
        assertTrue(texto.contains("123456"));
    }

    @Test
    void textoTemONomeOCodigoEAValidade() {
        String texto = envio.textoSimples("Maria Souza", "654321");
        assertTrue(texto.contains("Olá, Maria!"));
        assertTrue(texto.contains("654321"));
        assertTrue(texto.contains("10 minutos"));
        assertTrue(envio.html("Maria Souza", "654321").contains("654321"));
    }

    @Test
    void falhaNoServidorDeEmailViraMensagemAmigavel() {
        doThrow(new MailSendException("Connection refused")).when(mailSender).send(any(MimeMessage.class));
        EnvioEmailException e = assertThrows(EnvioEmailException.class,
                () -> envio.enviar("maria@teste.com", "Maria", "123456"));
        assertEquals("Não foi possível enviar o e-mail agora. Tente novamente em instantes.", e.getMessage());
    }
}
