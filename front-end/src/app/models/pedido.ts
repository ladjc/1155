export interface ItemPedidoRequest {
  produtoId: number;
  quantidade: number;
}

export interface PedidoRequest {
  // id do cliente logado (AuthService)
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
