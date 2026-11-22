package com.fatec.back_end.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fatec.back_end.model.Produto;
import com.fatec.back_end.service.ProdutoService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("produto")
public class ProdutoController {

    @Autowired
    private ProdutoService service;

    // GET /api/produto -> lista todos
    @GetMapping
    public ResponseEntity<List<Produto>> listar() {
        try {
            List<Produto> produtos = service.listar();

            if (produtos.isEmpty()) {
                return ResponseEntity.noContent().build(); // 204: não há produtos
            }

            return ResponseEntity.ok(produtos); // 200: lista de produtos
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500: erro no servidor
        }
    }

    // GET api/produto/{id} -> busca um
    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Integer id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST api/produto -> cadastra
    @PostMapping
    public ResponseEntity<Produto> salvar(@RequestBody Produto produto) {
        Produto novo = service.salvar(produto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novo);
    }

    // POST /api/produto/lote -> cadastra vários de uma vez (recebe uma lista)
    @PostMapping("/lote")
    public ResponseEntity<List<Produto>> salvarTodos(@RequestBody List<Produto> produtos) {
        List<Produto> novos = service.salvarTodos(produtos);
        return ResponseEntity.status(HttpStatus.CREATED).body(novos);
    }

    // PUT api/produto/{id} -> atualiza
    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Integer id, @RequestBody Produto produto) {
        return service.atualizar(id, produto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE api/produto/{id} -> exclui
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        if (service.deletar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}