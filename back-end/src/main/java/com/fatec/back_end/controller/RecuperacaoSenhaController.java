package com.fatec.back_end.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fatec.back_end.dto.ConfirmacaoCodigoRequest;
import com.fatec.back_end.dto.RedefinicaoSenhaRequest;
import com.fatec.back_end.dto.VerificacaoEmailRequest;
import com.fatec.back_end.exception.ClienteNaoEncontradoException;
import com.fatec.back_end.exception.CodigoInvalidoException;
import com.fatec.back_end.exception.EnvioEmailException;
import com.fatec.back_end.service.RecuperacaoSenhaService;

// Rotas da recuperação de senha ("Esqueci a senha")
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("cliente/recuperar-senha")
public class RecuperacaoSenhaController {

    private final RecuperacaoSenhaService service;

    public RecuperacaoSenhaController(RecuperacaoSenhaService service) {
        this.service = service;
    }

    // POST /api/cliente/recuperar-senha/verificar -> confere o e-mail e envia o código (200, 400, 404 ou 503)
    @PostMapping("/verificar")
    public ResponseEntity<?> solicitarCodigo(@RequestBody VerificacaoEmailRequest dados) {
        try {
            String email = service.solicitarCodigo(dados);
            return ResponseEntity.ok(Map.of("mensagem", "Código enviado para o e-mail informado.", "email", email));
        } catch (ClienteNaoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (EnvioEmailException e) {
            // O código não é salvo (a transação é desfeita): a pessoa pode tentar de novo
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("mensagem", e.getMessage()));
        } catch (CodigoInvalidoException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // POST /api/cliente/recuperar-senha/confirmar -> confere o código; 200 com o token ou 400
    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmarCodigo(@RequestBody ConfirmacaoCodigoRequest dados) {
        try {
            return ResponseEntity.ok(Map.of("token", service.confirmarCodigo(dados)));
        } catch (CodigoInvalidoException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // POST /api/cliente/recuperar-senha/redefinir -> grava a nova senha (204 ou 400)
    @PostMapping("/redefinir")
    public ResponseEntity<?> redefinirSenha(@RequestBody RedefinicaoSenhaRequest dados) {
        try {
            service.redefinirSenha(dados);
            return ResponseEntity.noContent().build();
        } catch (CodigoInvalidoException | IllegalArgumentException | ClienteNaoEncontradoException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }
}
