package com.fatec.back_end.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fatec.back_end.model.Pedido;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
}
