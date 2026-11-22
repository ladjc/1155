package com.fatec.back_end.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fatec.back_end.exception.EstoqueInsuficienteException;
import com.fatec.back_end.model.ItemPedido;
import com.fatec.back_end.model.Pedido;
import com.fatec.back_end.model.Produto;
import com.fatec.back_end.repository.PedidoRepository;
import com.fatec.back_end.repository.ProdutoRepository;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProdutoRepository produtoRepository;

    public PedidoService(PedidoRepository pedidoRepository, ProdutoRepository produtoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.produtoRepository = produtoRepository;
    }

    /**
     * Recebe somente produtoId e quantidade de cada item. Preço, total e estoque
     * são sempre apurados no servidor para que valores enviados pelo navegador
     * não possam ser alterados.
     */
    @Transactional
    public Pedido criar(Pedido pedido) {
        if (pedido == null || pedido.getItens() == null || pedido.getItens().isEmpty()) {
            throw new IllegalArgumentException("O pedido deve possuir pelo menos um item.");
        }
        if (pedido.getClienteId() != null && pedido.getClienteId() <= 0) {
            throw new IllegalArgumentException("O cliente informado é inválido.");
        }

        Map<Integer, Integer> quantidadesPorProduto = agruparQuantidades(pedido.getItens());
        List<ItemPedido> itensConfirmados = new ArrayList<>();
        BigDecimal valorTotal = BigDecimal.ZERO;

        for (Map.Entry<Integer, Integer> entrada : quantidadesPorProduto.entrySet()) {
            Produto produto = produtoRepository.buscarPorIdComBloqueio(entrada.getKey())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Produto " + entrada.getKey() + " não foi encontrado."));

            Integer estoqueAtual = produto.getEstoque();
            int quantidadeSolicitada = entrada.getValue();
            if (estoqueAtual == null || estoqueAtual < quantidadeSolicitada) {
                throw new EstoqueInsuficienteException(
                        "Estoque insuficiente para o produto " + produto.getNome() + ".");
            }

            if (produto.getPreco() == null || produto.getPreco() < 0) {
                throw new IllegalArgumentException("O produto " + produto.getNome() + " possui preço inválido.");
            }

            BigDecimal precoUnitario = BigDecimal.valueOf(produto.getPreco()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal valorItem = precoUnitario.multiply(BigDecimal.valueOf(quantidadeSolicitada));

            ItemPedido itemConfirmado = new ItemPedido();
            itemConfirmado.setProdutoId(produto.getId());
            itemConfirmado.setQuantidade(quantidadeSolicitada);
            itemConfirmado.setPrecoUnitario(precoUnitario);
            itemConfirmado.setValorTotal(valorItem);
            itensConfirmados.add(itemConfirmado);

            produto.setEstoque(estoqueAtual - quantidadeSolicitada);
            valorTotal = valorTotal.add(valorItem);
        }

        pedido.setId(null);
        pedido.setItens(itensConfirmados);
        pedido.setValorTotal(valorTotal);
        pedido.setDataCriacao(LocalDateTime.now());
        return pedidoRepository.save(pedido);
    }

    private Map<Integer, Integer> agruparQuantidades(List<ItemPedido> itens) {
        Map<Integer, Integer> quantidadesPorProduto = new LinkedHashMap<>();

        for (ItemPedido item : itens) {
            if (item == null || item.getProdutoId() == null || item.getProdutoId() <= 0) {
                throw new IllegalArgumentException("Cada item deve informar um produto válido.");
            }
            if (item.getQuantidade() == null || item.getQuantidade() <= 0) {
                throw new IllegalArgumentException("A quantidade de cada item deve ser maior que zero.");
            }

            try {
                quantidadesPorProduto.merge(item.getProdutoId(), item.getQuantidade(), Math::addExact);
            } catch (ArithmeticException e) {
                throw new IllegalArgumentException("Quantidade de item inválida.");
            }
        }

        return quantidadesPorProduto;
    }
}
