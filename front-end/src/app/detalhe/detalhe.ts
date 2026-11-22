
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TimeoutError } from 'rxjs';

import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';
import { ProdutoService } from '../services/produto';

@Component({
  imports: [CommonModule],
  selector: 'app-detalhe',
  styleUrl: './detalhe.css',
  templateUrl: './detalhe.html',
})

export class Detalhe implements OnInit, OnDestroy {

  obj: Produto = new Produto();

  // Controle da requisição
  carregando: boolean = false;
  erro: string = '';

  // Controle do alerta flutuante
  mensagem: string = "";
  mostrarAlerta = false;
  fadeOut = false;
  private alertaTimeout: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private produtoService: ProdutoService,
    private router: Router,
  ) { }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.carregarProduto();
  }

  // Busca o produto no back-end através do ID
  carregarProduto() {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let id: number = 0;

    // Primeiro tenta recuperar o ID diretamente
    const idSalvo = localStorage.getItem('produto-detalhe-id');

    if (idSalvo != null) {
      id = Number(idSalvo);
    } else {

      // Compatibilidade com a versão anterior da Vitrine,
      // que armazenava o objeto completo no localStorage.
      const json = localStorage.getItem('produto-detalhe');

      if (json != null) {
        try {
          const produtoSalvo = JSON.parse(json);
          id = Number(produtoSalvo.id);
        } catch {
          this.erro = 'Não foi possível recuperar o produto selecionado.';
          return;
        }
      }
    }

    // Verifica se o ID é válido
    if (!Number.isInteger(id) || id <= 0) {
      this.erro = 'Produto inválido. Volte à vitrine e selecione um produto.';
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.cdr.detectChanges();

    // Chamada assíncrona ao back-end
    this.produtoService.getProdutoPorId(id).subscribe({

      next: (produto) => {

        this.obj = produto;

        this.carregando = false;
        this.erro = '';

        this.cdr.detectChanges();
      },

      error: (e) => {

        this.obj = new Produto();
        this.erro = this.montarMensagemErro(e);

        this.carregando = false;

        this.cdr.detectChanges();
      }

    });
  }

  // Monta mensagens de erro conforme a resposta do back-end
  private montarMensagemErro(e: unknown): string {

    if (e instanceof TimeoutError) {
      return 'O servidor demorou demais para responder. Tente novamente.';
    }

    if (e instanceof HttpErrorResponse) {

      if (e.status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique se o back-end está rodando.';
      }

      if (e.status === 404) {
        return 'Produto não encontrado (404).';
      }

      if (e.status >= 500) {
        return 'Erro no servidor ao carregar o produto. Tente novamente mais tarde.';
      }
    }

    return 'Não foi possível carregar os detalhes do produto.';
  }

  // Adiciona produto ao carrinho
  adicionarCesta(obj: Produto) {

    const preco = obj.preco;

    let json = localStorage.getItem("itemCesta");

    if (json == null) {

      let item = new ItemCesta();
      item.produto = obj;
      item.quantidade = 1;
      item.valorTotal = preco;

      let itensCesta: ItemCesta[] = [item];

      localStorage.setItem("itemCesta", JSON.stringify(itensCesta));

    } else {

      let itensCesta: ItemCesta[] = JSON.parse(json);
      let encontrado = false;

      for (let item of itensCesta) {

        if (item.produto.id == obj.id) {

          item.quantidade += 1;
          item.valorTotal = item.quantidade * preco;

          encontrado = true;
          break;
        }
      }

      if (!encontrado) {

        let novoItem = new ItemCesta();
        novoItem.produto = obj;
        novoItem.quantidade = 1;
        novoItem.valorTotal = preco;

        itensCesta.push(novoItem);
      }

      localStorage.setItem("itemCesta", JSON.stringify(itensCesta));
    }

    sessionStorage.setItem('mensagemCarrinho', 'Produto adicionado com sucesso');
    this.router.navigate(['/cesta']);
  }

  // Exibe o alerta flutuante
  exibirAlerta(msg: string) {

    this.mensagem = msg;
    this.mostrarAlerta = true;
    this.fadeOut = false;

    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }

    setTimeout(() => {

      this.fadeOut = true;
      this.cdr.detectChanges();

    }, 4000);

    this.alertaTimeout = setTimeout(() => {

      this.mostrarAlerta = false;
      this.cdr.detectChanges();

    }, 5000);
  }

  ngOnDestroy() {
    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }
  }
}
