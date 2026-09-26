import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  constructor(private cdr: ChangeDetectorRef, private produtoService: ProdutoService,) {
  }

  ngOnInit() {
    this.lista = this.produtoService.getProdutos()
  }

  lista: Produto[] = [];

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
