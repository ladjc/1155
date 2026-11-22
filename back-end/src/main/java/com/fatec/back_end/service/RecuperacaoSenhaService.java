package com.fatec.back_end.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fatec.back_end.dto.ConfirmacaoCodigoRequest;
import com.fatec.back_end.dto.RedefinicaoSenhaRequest;
import com.fatec.back_end.dto.VerificacaoEmailRequest;
import com.fatec.back_end.exception.CodigoInvalidoException;
import com.fatec.back_end.model.Cliente;
import com.fatec.back_end.model.CodigoRecuperacao;
import com.fatec.back_end.repository.ClienteRepository;
import com.fatec.back_end.repository.CodigoRecuperacaoRepository;

/**
 * Recuperação de senha em 3 etapas:
 *  1. solicitarCodigo: confere o e-mail e "envia" um código de 6 dígitos;
 *  2. confirmarCodigo: confere o código e devolve uma autorização (token);
 *  3. redefinirSenha: com o token, grava a nova senha.
 */
@Service
public class RecuperacaoSenhaService {

    static final int VALIDADE_CODIGO_MINUTOS = 10;
    static final int VALIDADE_TOKEN_MINUTOS = 15;
    static final int MAX_TENTATIVAS = 5;

    private static final String MSG_SOLICITE_NOVO = "Código inválido. Solicite um novo código.";

    private final ClienteService clienteService;
    private final ClienteRepository clienteRepository;
    private final CodigoRecuperacaoRepository codigoRepository;
    private final EnvioCodigoService envioCodigo;
    private final PasswordEncoder passwordEncoder;
    private final Clock relogio;
    private final SecureRandom aleatorio = new SecureRandom();

    public RecuperacaoSenhaService(ClienteService clienteService, ClienteRepository clienteRepository,
            CodigoRecuperacaoRepository codigoRepository, EnvioCodigoService envioCodigo,
            PasswordEncoder passwordEncoder, Clock relogio) {
        this.clienteService = clienteService;
        this.clienteRepository = clienteRepository;
        this.codigoRepository = codigoRepository;
        this.envioCodigo = envioCodigo;
        this.passwordEncoder = passwordEncoder;
        this.relogio = relogio;
    }

    // ---------- 1ª etapa ----------
    @Transactional
    public String solicitarCodigo(VerificacaoEmailRequest dados) {
        // Valida o formato e se o e-mail está cadastrado (400 / 404)
        String email = clienteService.verificarEmailParaRecuperacao(dados);
        Cliente cliente = clienteRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CodigoInvalidoException(MSG_SOLICITE_NOVO));

        // Só o último código vale
        codigoRepository.deleteByClienteId(cliente.getId());

        // 000000 a 999999, gerado com SecureRandom (imprevisível)
        String codigo = String.format("%06d", aleatorio.nextInt(1_000_000));

        CodigoRecuperacao registro = new CodigoRecuperacao();
        registro.setClienteId(cliente.getId());
        registro.setCodigoHash(passwordEncoder.encode(codigo));
        registro.setExpiraEm(agora().plusMinutes(VALIDADE_CODIGO_MINUTOS));
        registro.setTentativas(0);
        registro.setUsado(false);
        codigoRepository.save(registro);

        envioCodigo.enviar(cliente.getEmail(), cliente.getNome(), codigo);
        return email;
    }

    // ---------- 2ª etapa ----------
    // noRollbackFor: a tentativa errada precisa ficar gravada mesmo com o erro
    @Transactional(noRollbackFor = CodigoInvalidoException.class)
    public String confirmarCodigo(ConfirmacaoCodigoRequest dados) {
        if (dados == null || vazio(dados.email())) {
            throw new IllegalArgumentException("Informe o seu e-mail.");
        }
        String codigo = dados.codigo() == null ? "" : dados.codigo().trim();
        if (!codigo.matches("\\d{6}")) {
            throw new IllegalArgumentException("Informe o código de 6 dígitos.");
        }

        Cliente cliente = clienteRepository.findByEmailIgnoreCase(dados.email().trim())
                .orElseThrow(() -> new CodigoInvalidoException(MSG_SOLICITE_NOVO));
        CodigoRecuperacao registro = codigoRepository.findTopByClienteIdOrderByIdDesc(cliente.getId())
                .orElseThrow(() -> new CodigoInvalidoException(MSG_SOLICITE_NOVO));

        if (registro.isUsado() || registro.getTokenHash() != null) {
            throw new CodigoInvalidoException("Este código já foi utilizado. Solicite um novo código.");
        }
        if (agora().isAfter(registro.getExpiraEm())) {
            throw new CodigoInvalidoException("O código expirou. Solicite um novo código.");
        }
        if (registro.getTentativas() >= MAX_TENTATIVAS) {
            throw new CodigoInvalidoException("Número de tentativas esgotado. Solicite um novo código.");
        }

        if (!passwordEncoder.matches(codigo, registro.getCodigoHash())) {
            registro.setTentativas(registro.getTentativas() + 1);
            codigoRepository.save(registro);
            int restantes = MAX_TENTATIVAS - registro.getTentativas();
            if (restantes <= 0) {
                throw new CodigoInvalidoException(
                        "Código incorreto. Número de tentativas esgotado. Solicite um novo código.");
            }
            throw new CodigoInvalidoException("Código incorreto. "
                    + (restantes == 1 ? "Resta 1 tentativa." : "Restam " + restantes + " tentativas."));
        }

        // Código certo: gera a autorização para trocar a senha
        byte[] bytes = new byte[32];
        aleatorio.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        registro.setTokenHash(sha256(token));
        registro.setTokenExpiraEm(agora().plusMinutes(VALIDADE_TOKEN_MINUTOS));
        codigoRepository.save(registro);
        return token;
    }

    // ---------- 3ª etapa ----------
    @Transactional
    public void redefinirSenha(RedefinicaoSenhaRequest dados) {
        if (dados == null || vazio(dados.token())) {
            throw new CodigoInvalidoException("Recuperação inválida. Comece novamente.");
        }
        CodigoRecuperacao registro = codigoRepository.findByTokenHash(sha256(dados.token()))
                .orElseThrow(() -> new CodigoInvalidoException("Recuperação inválida. Comece novamente."));

        if (registro.isUsado()) {
            throw new CodigoInvalidoException("Esta recuperação já foi utilizada. Solicite um novo código.");
        }
        if (registro.getTokenExpiraEm() == null || agora().isAfter(registro.getTokenExpiraEm())) {
            throw new CodigoInvalidoException("O prazo para redefinir a senha expirou. Solicite um novo código.");
        }

        // Aplica a mesma regra de senha do cadastro (400 se não atender)
        clienteService.redefinirSenha(registro.getClienteId(), dados.novaSenha());

        registro.setUsado(true);
        codigoRepository.save(registro);
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(relogio);
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    static String sha256(String texto) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
