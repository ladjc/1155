import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';

@Component({
  imports: [CommonModule],
  selector: 'app-vitrine',
  styleUrl: './vitrine.css',
  templateUrl: './vitrine.html',
})
export class Vitrine {
  mensagem: string = '';
  fadeOut:boolean = false;
  mostrarAlerta: boolean = false;
  private alertaTimeout: any;

  constructor(private cdr: ChangeDetectorRef) {}

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
    },
    {
      id: 3,
      nome: 'Placa de Vídeo NVIDIA GeForce GTX 1660 Super 6GB',
      preco: 1299.90,
      categoria: 'Placa de Vídeo',
      estoque: 20,
      descricao: 'GPU de entrada, indicada para jogos em Full HD com configurações médias/altas.'
    },
    {
      id: 4,
      nome: 'Fonte Corsair CV650 650W 80 Plus Bronze',
      preco: 449.90,
      categoria: 'Fonte',
      estoque: 0,
      descricao: 'Fonte de alimentação com certificação 80 Plus Bronze, ideal para montagens intermediárias.'
    },
    {
      id: 5,
      nome: 'Fonte XPG Core Reactor 750W 80 Plus Gold',
      preco: 699.90,
      categoria: 'Fonte',
      estoque: 15,
      descricao: 'Fonte totalmente modular com alta eficiência energética, recomendada para PCs de alto desempenho.'
    },
    {
      id: 6,
      nome: 'Fonte Pichau Gaming Hydra 500W',
      preco: 279.90,
      categoria: 'Fonte',
      estoque: 30,
      descricao: 'Fonte compacta e confiável para configurações básicas e de escritório.'
    },
    {
      id: 7,
      nome: 'Processador AMD Ryzen 7 7700X',
      preco: 2199.00,
      categoria: 'Processador',
      estoque: 10,
      descricao: 'Processador de 8 núcleos e 16 threads, excelente para jogos e multitarefas pesadas.'
    },
    {
      id: 8,
      nome: 'Processador Intel Core i5-13400F',
      preco: 1399.90,
      categoria: 'Processador',
      estoque: 18,
      descricao: 'Processador com 10 núcleos, equilíbrio entre desempenho e custo para uso geral.'
    },
    {
      id: 9,
      nome: 'Processador AMD Ryzen 5 5600',
      preco: 899.00,
      categoria: 'Processador',
      estoque: 22,
      descricao: 'Processador de 6 núcleos, ótima opção de entrada para montagens gamer.'
    },
    {
      id: 10,
      nome: 'Memória RAM Kingston Fury Beast 16GB (2x8GB) DDR4 3200MHz',
      preco: 259.90,
      categoria: 'Memória RAM',
      estoque: 40,
      descricao: 'Kit de memória com 2 pentes de 8GB, frequência de 3200MHz para desempenho equilibrado.'
    },
    {
      id: 11,
      nome: 'Memória RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz',
      preco: 899.90,
      categoria: 'Memória RAM',
      estoque: 14,
      descricao: 'Kit de memória de alta performance, ideal para setups de última geração.'
    },
    {
      id: 12,
      nome: 'Memória RAM Crucial 8GB DDR4 2666MHz',
      preco: 119.90,
      categoria: 'Memória RAM',
      estoque: 35,
      descricao: 'Memória de entrada, adequada para uso básico e escritório.'
    },
    {
      id: 13,
      nome: 'Placa-mãe ASUS Prime B550M-A',
      preco: 649.90,
      categoria: 'Placa-mãe',
      estoque: 16,
      descricao: 'Placa-mãe micro-ATX com suporte a processadores AMD Ryzen e slots M.2.'
    },
    {
      id: 14,
      nome: 'Placa-mãe Gigabyte Z790 Aorus Elite',
      preco: 1899.00,
      categoria: 'Placa-mãe',
      estoque: 9,
      descricao: 'Placa-mãe ATX de alto desempenho com suporte a DDR5 e múltiplos slots PCIe.'
    },
    {
      id: 15,
      nome: 'Placa-mãe ASRock A320M-HDV',
      preco: 399.90,
      categoria: 'Placa-mãe',
      estoque: 20,
      descricao: 'Placa-mãe compacta e econômica para montagens básicas.'
    },
    {
      id: 16,
      nome: 'SSD Kingston NV2 1TB NVMe',
      preco: 449.90,
      categoria: 'Armazenamento',
      estoque: 28,
      descricao: 'SSD NVMe de alta velocidade, ideal para reduzir o tempo de carregamento de jogos e sistema.'
    },
    {
      id: 17,
      nome: 'HD Seagate Barracuda 2TB',
      preco: 379.90,
      categoria: 'Armazenamento',
      estoque: 24,
      descricao: 'HD de 2TB para armazenamento de arquivos, jogos e backups.'
    },
    {
      id: 18,
      nome: 'Water Cooler Cooler Master MasterLiquid ML240L 240mm',
      preco: 549.90,
      categoria: 'Refrigeração',
      estoque: 13,
      descricao: 'Water cooler com radiador de 240mm, oferece resfriamento eficiente para CPUs de alto desempenho.'
    },
    {
      id: 19,
      nome: 'Gabinete Cougar MX330-G ATX RGB',
      preco: 429.90,
      categoria: 'Gabinete',
      estoque: 17,
      descricao: 'Gabinete ATX com painel lateral em vidro temperado e ventoinhas RGB inclusas.'
    },
    {
      id: 20,
      nome: 'Monitor LG UltraGear 24" Full HD 144Hz',
      preco: 999.90,
      categoria: 'Periféricos',
      estoque: 11,
      descricao: 'Monitor com taxa de atualização de 144Hz, ideal para jogos competitivos.'
    }
  ];

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
