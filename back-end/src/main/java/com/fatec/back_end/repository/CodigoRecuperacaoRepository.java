package com.fatec.back_end.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fatec.back_end.model.CodigoRecuperacao;

@Repository
public interface CodigoRecuperacaoRepository extends JpaRepository<CodigoRecuperacao, Integer> {

    // Código mais recente do cliente (só o último vale)
    Optional<CodigoRecuperacao> findTopByClienteIdOrderByIdDesc(Integer clienteId);

    Optional<CodigoRecuperacao> findByTokenHash(String tokenHash);

    // Um novo pedido de código invalida os anteriores
    void deleteByClienteId(Integer clienteId);
}
