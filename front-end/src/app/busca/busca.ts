import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';

@Component({
  imports: [CommonModule],
  selector: 'app-busca',
  styleUrl: './busca.css',
  templateUrl: './busca.html',
})

export class Busca {

  mensagemAlerta:string = '';
  mostrarAlerta:boolean = false;
  private alertaTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {
    
  }


  verDetalhe(obj: Produto) {
      localStorage.setItem("produto-detalhe", JSON.stringify(obj));
      location.href = "detalhes";
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


  lista: Produto[] = [
      {
        id: 1,
        nome: 'Placa de Vídeo NVIDIA GeForce RTX 4070 12GB',
        preco: 3899.90,
        categoria: 'Placa de Vídeo',
        estoque: 12,
        descricao: 'GPU com 12GB GDDR6X, suporte a DLSS 3 e ray tracing, ideal para jogos em 1440p.'
      },
      {
        id: 2,
        nome: 'Placa de Vídeo AMD Radeon RX 7800 XT 16GB',
        preco: 3299.00,
        categoria: 'Placa de Vídeo',
        estoque: 8,
        descricao: 'GPU com 16GB GDDR6, ótimo desempenho em 1440p com bom custo-benefício.'
      }
    ]



}
