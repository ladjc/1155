import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { ItemCesta } from '../models/item-cesta';
import { PedidoRequest } from '../models/pedido';
import { PedidoService } from '../services/pedido';

@Component({
  imports: [CommonModule],
  selector: 'app-cesta',
  styleUrl: './cesta.css',
  templateUrl: './cesta.html',
})
export class Cesta implements OnInit, OnDestroy {

  mensagem: string = "";
  mensagemPedido: string = "";
  valorCesta: number = 0;
  enviandoPedido: boolean = false;
  private alertaCarrinhoTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private pedidoService: PedidoService
  ) { }


  itens: ItemCesta[] = [];

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const mensagemCarrinho = sessionStorage.getItem('mensagemCarrinho');
    if (mensagemCarrinho) {
      this.mensagemPedido = mensagemCarrinho;
      sessionStorage.removeItem('mensagemCarrinho');
      this.ocultarAlertaDeItemDepoisDeUmTempo();
    }

    let json = localStorage.getItem("itemCesta");

    if (json == null) {
      this.mensagem = "Cesta vazia, adicione produtos!";
    } else {
      this.itens = JSON.parse(json);

      if (this.itens.length == 0) {
        this.mensagem = "Cesta vazia, adicione produtos!";
      } else {
        this.mensagem = "";
      }
    }

    this.calculaTotal();
  }

  calculaTotal() {
    let soma = 0;
    for (let item of this.itens) {
      soma += this.subtotal(item);
    }
    return soma;
  }

  aumentar(item: ItemCesta) {
    const preco = item.produto.preco;

    item.quantidade++;
    item.valorTotal = item.quantidade * preco;

    this.salvarCesta();
  }

  diminuir(item: ItemCesta) {
    const preco = item.produto.preco;

    if (item.quantidade > 1) {
      item.quantidade--;
      item.valorTotal = item.quantidade * preco;
      this.salvarCesta();
    } else {
      this.remover(item);
    }
  }

  remover(item: ItemCesta) {
    let index = this.itens.indexOf(item);
    if (index >= 0) {
      this.itens.splice(index, 1);
    }

    this.salvarCesta();
  }

  limparCarrinho() {
    this.itens = [];
    this.salvarCesta();
  }

  salvarCesta() {
    localStorage.setItem("itemCesta", JSON.stringify(this.itens));

    if (this.itens.length == 0) {
      this.mensagem = "Cesta vazia, adicione produtos!";
    } else {
      this.mensagem = "";
    }

    this.calculaTotal();
  }

  subtotal(item: ItemCesta): number {
    let valorUnit = item.produto.preco;
    return valorUnit * item.quantidade;
  }

  finalizarCompra() {
    if (this.itens.length === 0 || this.enviandoPedido) {
      return;
    }

    const pedido: PedidoRequest = {
      // Sem login por enquanto. O back-end já está preparado para receber o id.
      clienteId: null,
      itens: this.itens.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
      })),
    };

    this.enviandoPedido = true;
    this.cancelarOcultacaoDoAlertaDeItem();
    this.mensagemPedido = '';

    this.pedidoService.criar(pedido).subscribe({
      next: () => {
        this.enviandoPedido = false;
        this.limparCarrinho();
        this.mensagemPedido = 'Pedido realizado com sucesso';
      },
      error: (erro) => {
        this.enviandoPedido = false;
        this.mensagemPedido = this.montarMensagemErroPedido(erro);
      },
    });
  }

  private montarMensagemErroPedido(erro: unknown): string {
    if (erro instanceof TimeoutError) {
      return 'O servidor demorou demais para confirmar o pedido. Tente novamente.';
    }

    if (erro instanceof HttpErrorResponse) {
      const mensagemApi = erro.error?.mensagem;
      if (typeof mensagemApi === 'string') {
        return mensagemApi;
      }
      if (erro.status === 0) {
        return 'Não foi possível conectar ao servidor para finalizar a compra.';
      }
    }

    return 'Não foi possível finalizar a compra. Tente novamente.';
  }

  private ocultarAlertaDeItemDepoisDeUmTempo(): void {
    this.cancelarOcultacaoDoAlertaDeItem();
    this.alertaCarrinhoTimeout = setTimeout(() => {
      this.mensagemPedido = '';
      this.alertaCarrinhoTimeout = undefined;
    }, 4000);
  }

  private cancelarOcultacaoDoAlertaDeItem(): void {
    if (this.alertaCarrinhoTimeout) {
      clearTimeout(this.alertaCarrinhoTimeout);
      this.alertaCarrinhoTimeout = undefined;
    }
  }

  ngOnDestroy(): void {
    this.cancelarOcultacaoDoAlertaDeItem();
  }
}
