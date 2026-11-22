package com.fatec.back_end.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fatec.back_end.model.Produto;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Integer> {

    // Busca produtos de uma categoria (ex.: "Placa de vídeo")
    List<Produto> findByCategoria(String categoria);

    // Busca produtos cujo nome contenha o texto, ignorando maiúsculas/minúsculas
    List<Produto> findByNomeContainingIgnoreCase(String nome);

}