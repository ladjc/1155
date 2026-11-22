package com.fatec.back_end.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fatec.back_end.model.Produto;

import jakarta.persistence.LockModeType;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Integer> {

    // Busca produtos de uma categoria (ex.: "Placa de Vídeo"), ignorando maiúsculas/minúsculas
    List<Produto> findByCategoriaIgnoreCase(String categoria);

    // Busca produtos cujo nome contenha o texto, ignorando maiúsculas/minúsculas
    List<Produto> findByNomeContainingIgnoreCase(String nome);

    // Busca por parte do nome E categoria ao mesmo tempo
    List<Produto> findByNomeContainingIgnoreCaseAndCategoriaIgnoreCase(String nome, String categoria);

    // Busca os produtos da vitrine (destaque = true)
    List<Produto> findByDestaqueTrue();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select produto from Produto produto where produto.id = :id")
    Optional<Produto> buscarPorIdComBloqueio(@Param("id") Integer id);
}
