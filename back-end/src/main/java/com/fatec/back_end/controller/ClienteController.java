package com.fatec.back_end.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fatec.back_end.dto.AlteracaoSenhaRequest;
import com.fatec.back_end.dto.ClienteAtualizacaoRequest;
import com.fatec.back_end.dto.LoginRequest;
import com.fatec.back_end.exception.ClienteJaCadastradoException;
import com.fatec.back_end.exception.ClienteNaoEncontradoException;
import com.fatec.back_end.exception.CredenciaisInvalidasException;
import com.fatec.back_end.model.Cliente;
import com.fatec.back_end.service.ClienteService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("cliente")
public class ClienteController {

    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    // POST /api/cliente -> cadastra um cliente (201, 400 ou 409)
    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Cliente cliente) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrar(cliente));
        } catch (ClienteJaCadastradoException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // POST /api/cliente/login -> 200 com os dados do cliente, 400 ou 401
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest login) {
        try {
            return ResponseEntity.ok(service.autenticar(login));
        } catch (CredenciaisInvalidasException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // PUT /api/cliente/{id} -> atualiza nome, e-mail, telefone, documento e endereço (200, 400, 401, 404 ou 409)
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Integer id, @RequestBody ClienteAtualizacaoRequest dados) {
        try {
            return ResponseEntity.ok(service.atualizar(id, dados));
        } catch (ClienteNaoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (CredenciaisInvalidasException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("mensagem", e.getMessage()));
        } catch (ClienteJaCadastradoException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    // PUT /api/cliente/{id}/senha -> troca só a senha (204, 400, 401 ou 404)
    @PutMapping("/{id}/senha")
    public ResponseEntity<?> alterarSenha(@PathVariable Integer id, @RequestBody AlteracaoSenhaRequest dados) {
        try {
            service.alterarSenha(id, dados);
            return ResponseEntity.noContent().build();
        } catch (ClienteNaoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
        } catch (CredenciaisInvalidasException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }
}
