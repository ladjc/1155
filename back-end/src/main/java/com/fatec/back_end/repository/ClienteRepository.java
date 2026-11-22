package com.fatec.back_end.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fatec.back_end.model.Cliente;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    Optional<Cliente> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByDocumento(String documento);

    // Na atualização, o próprio cliente não conta como "repetido"
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Integer id);

    boolean existsByDocumentoAndIdNot(String documento, Integer id);
}
