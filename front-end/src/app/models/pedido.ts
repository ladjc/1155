export interface ItemPedidoRequest {
  produtoId: number;
  quantidade: number;
}

export interface PedidoRequest {
  // Será preenchido quando o módulo de cliente/autenticação estiver disponível.
  clienteId: number | null;
  itens: ItemPedidoRequest[];
}

export interface ItemPedido {
  id: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
}

export interface Pedido {
  id: number;
  clienteId: number | null;
  valorTotal: number;
  dataCriacao: string;
  itens: ItemPedido[];
}
