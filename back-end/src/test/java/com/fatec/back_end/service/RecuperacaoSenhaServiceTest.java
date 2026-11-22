package com.fatec.back_end.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fatec.back_end.dto.ConfirmacaoCodigoRequest;
import com.fatec.back_end.dto.RedefinicaoSenhaRequest;
import com.fatec.back_end.dto.VerificacaoEmailRequest;
import com.fatec.back_end.exception.CodigoInvalidoException;
import com.fatec.back_end.model.Cliente;
import com.fatec.back_end.model.CodigoRecuperacao;
import com.fatec.back_end.repository.ClienteRepository;
import com.fatec.back_end.repository.CodigoRecuperacaoRepository;

class RecuperacaoSenhaServiceTest {

    // Relógio que o teste consegue adiantar
    static class RelogioAjustavel extends Clock {
        Instant instante = Instant.parse("2026-11-22T12:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instante;
        }

        void adiantar(Duration d) {
            instante = instante.plus(d);
        }
    }

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private ClienteService clienteService;
    private ClienteRepository clienteRepository;
    private CodigoRecuperacaoRepository codigoRepository;
    private EnvioCodigoService envio;
    private RelogioAjustavel relogio;
    private RecuperacaoSenhaService service;

    // "Banco" em memória com o último código salvo e o último código "enviado"
    private final AtomicReference<CodigoRecuperacao> salvo = new AtomicReference<>();
    private final AtomicReference<String> codigoEnviado = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        clienteService = mock(ClienteService.class);
        clienteRepository = mock(ClienteRepository.class);
        codigoRepository = mock(CodigoRecuperacaoRepository.class);
        envio = mock(EnvioCodigoService.class);
        relogio = new RelogioAjustavel();
        service = new RecuperacaoSenhaService(clienteService, clienteRepository, codigoRepository, envio, encoder, relogio);

        Cliente cliente = new Cliente();
        cliente.setId(7);
        cliente.setNome("Maria");
        cliente.setEmail("maria@teste.com");
        when(clienteService.verificarEmailParaRecuperacao(any())).thenReturn("maria@teste.com");
        when(clienteRepository.findByEmailIgnoreCase("maria@teste.com")).thenReturn(Optional.of(cliente));

        when(codigoRepository.save(any())).thenAnswer(inv -> {
            salvo.set(inv.getArgument(0));
            return inv.getArgument(0);
        });
        when(codigoRepository.findTopByClienteIdOrderByIdDesc(7)).thenAnswer(inv -> Optional.ofNullable(salvo.get()));
        when(codigoRepository.findByTokenHash(anyString())).thenAnswer(inv -> {
            CodigoRecuperacao c = salvo.get();
            return c != null && inv.getArgument(0).equals(c.getTokenHash()) ? Optional.of(c) : Optional.empty();
        });
        doAnswer(inv -> {
            codigoEnviado.set(inv.getArgument(2));
            return null;
        }).when(envio).enviar(anyString(), anyString(), anyString());
    }

    private String solicitar() {
        service.solicitarCodigo(new VerificacaoEmailRequest("maria@teste.com"));
        return codigoEnviado.get();
    }

    private String confirmar(String codigo) {
        return service.confirmarCodigo(new ConfirmacaoCodigoRequest("maria@teste.com", codigo));
    }

    private String errado(String certo) {
        return certo.equals("000000") ? "111111" : "000000";
    }

    @Test
    void solicitarGeraCodigoDe6DigitosEGuardaSoOHash() {
        String codigo = solicitar();

        assertTrue(codigo.matches("\\d{6}"));
        verify(codigoRepository).deleteByClienteId(7); // invalida códigos anteriores
        assertTrue(encoder.matches(codigo, salvo.get().getCodigoHash()));
        assertTrue(!salvo.get().getCodigoHash().contains(codigo));
    }

    @Test
    void codigoCertoDevolveTokenQueRedefineASenha() {
        String token = confirmar(solicitar());
        assertNotNull(token);

        service.redefinirSenha(new RedefinicaoSenhaRequest(token, "Nova@4567"));

        verify(clienteService).redefinirSenha(7, "Nova@4567");
        assertTrue(salvo.get().isUsado());
    }

    @Test
    void codigoErradoContaTentativasEBloqueiaNaQuinta() {
        String errado = errado(solicitar());

        CodigoInvalidoException e1 = assertThrows(CodigoInvalidoException.class, () -> confirmar(errado));
        assertEquals("Código incorreto. Restam 4 tentativas.", e1.getMessage());
        for (int i = 0; i < 3; i++) {
            assertThrows(CodigoInvalidoException.class, () -> confirmar(errado));
        }
        CodigoInvalidoException e5 = assertThrows(CodigoInvalidoException.class, () -> confirmar(errado));
        assertEquals("Código incorreto. Número de tentativas esgotado. Solicite um novo código.", e5.getMessage());

        // Nem o código certo vale mais depois de esgotar as tentativas
        CodigoInvalidoException depois = assertThrows(CodigoInvalidoException.class, () -> confirmar(codigoEnviado.get()));
        assertEquals("Número de tentativas esgotado. Solicite um novo código.", depois.getMessage());
    }

    @Test
    void codigoExpiraEm10Minutos() {
        String codigo = solicitar();
        relogio.adiantar(Duration.ofMinutes(11));
        CodigoInvalidoException e = assertThrows(CodigoInvalidoException.class, () -> confirmar(codigo));
        assertEquals("O código expirou. Solicite um novo código.", e.getMessage());
    }

    @Test
    void codigoNaoPodeSerUsadoDuasVezes() {
        String codigo = solicitar();
        confirmar(codigo);
        assertThrows(CodigoInvalidoException.class, () -> confirmar(codigo));
    }

    @Test
    void formatoDoCodigoEValidado() {
        solicitar();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> confirmar("12a45"));
        assertEquals("Informe o código de 6 dígitos.", e.getMessage());
    }

    @Test
    void tokenExpiraUsadoOuInvalidoNaoRedefine() {
        String token = confirmar(solicitar());

        assertThrows(CodigoInvalidoException.class,
                () -> service.redefinirSenha(new RedefinicaoSenhaRequest("token-falso", "Nova@4567")));

        relogio.adiantar(Duration.ofMinutes(16));
        CodigoInvalidoException expirado = assertThrows(CodigoInvalidoException.class,
                () -> service.redefinirSenha(new RedefinicaoSenhaRequest(token, "Nova@4567")));
        assertEquals("O prazo para redefinir a senha expirou. Solicite um novo código.", expirado.getMessage());
        verify(clienteService, never()).redefinirSenha(eq(7), anyString());
    }

    @Test
    void tokenSoServeUmaVez() {
        String token = confirmar(solicitar());
        service.redefinirSenha(new RedefinicaoSenhaRequest(token, "Nova@4567"));
        assertThrows(CodigoInvalidoException.class,
                () -> service.redefinirSenha(new RedefinicaoSenhaRequest(token, "Outra@4567")));
    }
}
