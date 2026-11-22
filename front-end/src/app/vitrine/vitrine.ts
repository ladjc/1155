import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';
import { ProdutoService } from '../services/produto';

@Component({
  imports: [CommonModule],
  selector: 'app-vitrine',
  styleUrl: './vitrine.css',
  templateUrl: './vitrine.html',
})
export class Vitrine implements OnInit {
  mensagem: string = '';
  fadeOut: boolean = false;
  mostrarAlerta: boolean = false;
  private alertaTimeout: any;

  lista: Produto[] = [];
  carregando: boolean = false;
  erro: string = '';

  constructor(private cdr: ChangeDetectorRef, private produtoService: ProdutoService) {}

  ngOnInit() {
    this.carregarVitrine();
  }

  carregarVitrine() {
    this.carregando = true;
    this.erro = '';
    this.cdr.detectChanges();

    this.produtoService.getVitrine().subscribe({
      next: (produtos) => {
        this.lista = produtos ?? [];
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.lista = [];
        this.erro = this.montarMensagemErro(e);
        this.carregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private montarMensagemErro(e: unknown): string {
    if (e instanceof TimeoutError) {
      return 'O servidor demorou demais para responder. Tente novamente.';
    }
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) {
        return 'Não foi possível conectar ao servidor. Verifique se o back-end está rodando.';
      }
      if (e.status === 404) {
        return 'Serviço da vitrine não encontrado (404).';
      }
      if (e.status >= 500) {
        return 'Erro no servidor ao carregar a vitrine. Tente novamente mais tarde.';
      }
    }
    return 'Não foi possível carregar os produtos.';
  }

  verDetalhe(obj: Produto) {
    localStorage.setItem('produto-detalhe', JSON.stringify(obj));
    location.href = 'detalhes';
  }

  adicionarCesta(obj: Produto) {
    const preco = obj.preco;

    let json = localStorage.getItem('itemCesta');

    if (json == null) {
      let item = new ItemCesta();
      item.produto = obj;
      item.quantidade = 1;
      item.valorTotal = preco;

      let itensCesta: ItemCesta[] = [item];
      localStorage.setItem('itemCesta', JSON.stringify(itensCesta));
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

      localStorage.setItem('itemCesta', JSON.stringify(itensCesta));
    }

    this.exibirAlerta('Produto adicionado ao carrinho com sucesso!!!');
  }

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
}
