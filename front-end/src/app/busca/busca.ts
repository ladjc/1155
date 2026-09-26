import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';
import { ProdutoService } from '../services/produto';

@Component({
  imports: [CommonModule],
  selector: 'app-busca',
  styleUrl: './busca.css',
  templateUrl: './busca.html',
})
export class Busca implements OnInit {
  produtos: Produto[] = [];
  mensagemAlerta: string = '';
  mostrarAlerta: boolean = false;
  private alertaTimeout: any;

  termoBusca: string = '';
  produtosEncontrados: Produto[] = [];
  produtosSemelhantes: Produto[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private produtoService: ProdutoService,
  ) {}

  ngOnInit(): void {
    this.produtos = this.produtoService.getProdutos().filter((p) => p.estoque > 0);

    this.route.queryParamMap.subscribe((params) => {
      const categoria = params.get('categoria');

      if (categoria) {
        this.termoBusca = categoria;
        this.pesquisarPorCategoria(categoria);
      } else {
        this.termoBusca = params.get('termo') ?? '';
        this.pesquisar();
      }

      this.cdr.detectChanges();
    });
  }

  pesquisarPorCategoria(categoria: string): void {
    this.termoBusca = categoria;
    this.produtosEncontrados = this.produtos.filter((p) => p.categoria === categoria);
    this.produtosSemelhantes = [];
  }

  pesquisar(): void {
    const termo = this.termoBusca.trim().toLowerCase();

    if (!termo) {
      this.produtosEncontrados = [];
      this.produtosSemelhantes = [];
      return;
    }

    // Produtos encontrados cujo o nome contém o termo pesquisado
    this.produtosEncontrados = this.produtos.filter((p) => p.nome.toLowerCase().includes(termo));

    const idsEncontrados = new Set(this.produtosEncontrados.map((p) => p.id));
    const categoriasEncontradas = new Set(this.produtosEncontrados.map((p) => p.categoria));

    // Produtos semelhantes que estão mesma categoria dos encontrados, mas que não estão na lista de encontrados
    this.produtosSemelhantes = this.produtos.filter(
      (p) => categoriasEncontradas.has(p.categoria) && !idsEncontrados.has(p.id),
    );
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
      this.exibirAlerta('Produto adicionado ao carrinho com sucesso!!!');
    }
  }

  exibirAlerta(msg: string) {
    this.mensagemAlerta = msg;
    this.mostrarAlerta = true;

    if (this.alertaTimeout) {
      clearTimeout(this.alertaTimeout);
    }

    this.alertaTimeout = setTimeout(() => {
      this.mostrarAlerta = false;
      this.cdr.detectChanges();
    }, 5000);
  }
}
