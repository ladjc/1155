import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';


@Component({
  imports: [CommonModule],
  selector: 'app-detalhe',
  styleUrl: './detalhe.css',
  templateUrl: './detalhe.html',
})


export class Detalhe implements OnInit {
  obj: Produto = new Produto();

  mensagem: string = "";
  mostrarAlerta = false;
  private alertaTimeout: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let json = localStorage.getItem("produto-detalhe");
    if (json == null) {
      this.mensagem = "Produto Invalido, Verifique!";
    } else {
      this.mensagem = "";
      this.obj = JSON.parse(json);
    }
  }

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
      this.exibirAlerta("Produto adicionado ao carrinho com sucesso!!!");
    }
  }

  exibirAlerta(msg: string) {
    this.mensagem = msg;
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