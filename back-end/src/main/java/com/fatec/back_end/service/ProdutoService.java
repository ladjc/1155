package com.fatec.back_end.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fatec.back_end.model.Produto;
import com.fatec.back_end.repository.ProdutoRepository;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository repository;

    public List<Produto> listar() {
        return repository.findAll();
    }

    public Optional<Produto> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Produto salvar(Produto produto) {
        // Garante que é um cadastro novo (o id é gerado pelo banco)
        produto.setId(null);
        return repository.save(produto);
    }

    public List<Produto> salvarTodos(List<Produto> produtos) {
        // Ignora qualquer id enviado: o banco gera os ids
        produtos.forEach(produto -> produto.setId(null));
        return repository.saveAll(produtos);
    }

    public Optional<Produto> atualizar(Integer id, Produto dados) {
        return repository.findById(id).map(produto -> {
            produto.setNome(dados.getNome());
            produto.setPreco(dados.getPreco());
            produto.setCategoria(dados.getCategoria());
            produto.setEstoque(dados.getEstoque());
            produto.setDescricao(dados.getDescricao());
            produto.setDestaque(dados.getDestaque());
            return repository.save(produto);
        });
    }

    public boolean deletar(Integer id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}