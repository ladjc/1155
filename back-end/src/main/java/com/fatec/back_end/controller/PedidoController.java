package com.fatec.back_end.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fatec.back_end.exception.EstoqueInsuficienteException;
import com.fatec.back_end.model.Pedido;
import com.fatec.back_end.service.PedidoService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("pedido")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Pedido pedido) {
        try {
            Pedido novoPedido = service.criar(pedido);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoPedido);
        } catch (EstoqueInsuficienteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensagem", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }
}
