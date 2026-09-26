import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export class Produto {
  id: number = 0;
  nome: string = '';
  preco: number = 0;
  categoria: string = '';
  estoque: number = 0;
  descricao: string = '';
}

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-nav',
  styleUrl: './nav.css',
  templateUrl: './nav.html',
})
export class Nav {
  termoBusca = '';
  sugestoesVisiveis = false;
  produtosFiltrados: Produto[] = [];

  private produtos: Produto[] = [
    {
      id: 1,
      nome: 'Placa de Vídeo NVIDIA GeForce RTX 4070 12GB',
      preco: 3899.9,
      categoria: 'Placa de Vídeo',
      estoque: 12,
      descricao: 'GPU com 12GB GDDR6X, suporte a DLSS 3 e ray tracing, ideal para jogos em 1440p.',
    },
    {
      id: 2,
      nome: 'Placa de Vídeo AMD Radeon RX 7800 XT 16GB',
      preco: 3299.0,
      categoria: 'Placa de Vídeo',
      estoque: 8,
      descricao: 'GPU com 16GB GDDR6, ótimo desempenho em 1440p com bom custo-benefício.',
    },
    {
      id: 3,
      nome: 'Placa de Vídeo NVIDIA GeForce GTX 1660 Super 6GB',
      preco: 1299.9,
      categoria: 'Placa de Vídeo',
      estoque: 20,
      descricao: 'GPU de entrada, indicada para jogos em Full HD com configurações médias/altas.',
    },
    {
      id: 4,
      nome: 'Fonte Corsair CV650 650W 80 Plus Bronze',
      preco: 449.9,
      categoria: 'Fonte',
      estoque: 0,
      descricao:
        'Fonte de alimentação com certificação 80 Plus Bronze, ideal para montagens intermediárias.',
    },
    {
      id: 5,
      nome: 'Fonte XPG Core Reactor 750W 80 Plus Gold',
      preco: 699.9,
      categoria: 'Fonte',
      estoque: 15,
      descricao:
        'Fonte totalmente modular com alta eficiência energética, recomendada para PCs de alto desempenho.',
    },
    {
      id: 6,
      nome: 'Fonte Pichau Gaming Hydra 500W',
      preco: 279.9,
      categoria: 'Fonte',
      estoque: 30,
      descricao: 'Fonte compacta e confiável para configurações básicas e de escritório.',
    },
    {
      id: 7,
      nome: 'Processador AMD Ryzen 7 7700X',
      preco: 2199.0,
      categoria: 'Processador',
      estoque: 10,
      descricao:
        'Processador de 8 núcleos e 16 threads, excelente para jogos e multitarefas pesadas.',
    },
    {
      id: 8,
      nome: 'Processador Intel Core i5-13400F',
      preco: 1399.9,
      categoria: 'Processador',
      estoque: 18,
      descricao: 'Processador com 10 núcleos, equilíbrio entre desempenho e custo para uso geral.',
    },
    {
      id: 9,
      nome: 'Processador AMD Ryzen 5 5600',
      preco: 899.0,
      categoria: 'Processador',
      estoque: 22,
      descricao: 'Processador de 6 núcleos, ótima opção de entrada para montagens gamer.',
    },
    {
      id: 10,
      nome: 'Memória RAM Kingston Fury Beast 16GB (2x8GB) DDR4 3200MHz',
      preco: 259.9,
      categoria: 'Memória RAM',
      estoque: 40,
      descricao:
        'Kit de memória com 2 pentes de 8GB, frequência de 3200MHz para desempenho equilibrado.',
    },
    {
      id: 11,
      nome: 'Memória RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz',
      preco: 899.9,
      categoria: 'Memória RAM',
      estoque: 14,
      descricao: 'Kit de memória de alta performance, ideal para setups de última geração.',
    },
    {
      id: 12,
      nome: 'Memória RAM Crucial 8GB DDR4 2666MHz',
      preco: 119.9,
      categoria: 'Memória RAM',
      estoque: 35,
      descricao: 'Memória de entrada, adequada para uso básico e escritório.',
    },
    {
      id: 13,
      nome: 'Placa-mãe ASUS Prime B550M-A',
      preco: 649.9,
      categoria: 'Placa-mãe',
      estoque: 16,
      descricao: 'Placa-mãe micro-ATX com suporte a processadores AMD Ryzen e slots M.2.',
    },
    {
      id: 14,
      nome: 'Placa-mãe Gigabyte Z790 Aorus Elite',
      preco: 1899.0,
      categoria: 'Placa-mãe',
      estoque: 9,
      descricao: 'Placa-mãe ATX de alto desempenho com suporte a DDR5 e múltiplos slots PCIe.',
    },
    {
      id: 15,
      nome: 'Placa-mãe ASRock A320M-HDV',
      preco: 399.9,
      categoria: 'Placa-mãe',
      estoque: 20,
      descricao: 'Placa-mãe compacta e econômica para montagens básicas.',
    },
    {
      id: 16,
      nome: 'SSD Kingston NV2 1TB NVMe',
      preco: 449.9,
      categoria: 'Armazenamento',
      estoque: 28,
      descricao:
        'SSD NVMe de alta velocidade, ideal para reduzir o tempo de carregamento de jogos e sistema.',
    },
    {
      id: 17,
      nome: 'HD Seagate Barracuda 2TB',
      preco: 379.9,
      categoria: 'Armazenamento',
      estoque: 24,
      descricao: 'HD de 2TB para armazenamento de arquivos, jogos e backups.',
    },
    {
      id: 18,
      nome: 'Water Cooler Cooler Master MasterLiquid ML240L 240mm',
      preco: 549.9,
      categoria: 'Refrigeração',
      estoque: 13,
      descricao:
        'Water cooler com radiador de 240mm, oferece resfriamento eficiente para CPUs de alto desempenho.',
    },
    {
      id: 19,
      nome: 'Gabinete Cougar MX330-G ATX RGB',
      preco: 429.9,
      categoria: 'Gabinete',
      estoque: 17,
      descricao: 'Gabinete ATX com painel lateral em vidro temperado e ventoinhas RGB inclusas.',
    },
    {
      id: 20,
      nome: 'Monitor LG UltraGear 24" Full HD 144Hz',
      preco: 999.9,
      categoria: 'Periféricos',
      estoque: 11,
      descricao: 'Monitor com taxa de atualização de 144Hz, ideal para jogos competitivos.',
    },
  ];

  constructor(
    private elementRef: ElementRef,
    private router: Router,
  ) {}

  onInputBusca(): void {
    const termo = this.termoBusca.trim().toLowerCase();

    if (!termo) {
      this.produtosFiltrados = [];
      this.sugestoesVisiveis = false;
      return;
    }

    this.produtosFiltrados = this.produtos
      .filter(
        (p) => p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo),
      )
      .slice(0, 6);

    this.sugestoesVisiveis = this.produtosFiltrados.length > 0;
  }

  onFocusBusca(): void {
    if (this.produtosFiltrados.length > 0) {
      this.sugestoesVisiveis = true;
    }
  }

  selecionarProduto(produto: Produto): void {
    this.termoBusca = produto.nome;
    this.sugestoesVisiveis = false;
    this.onBuscar();
  }

  onBuscar(): void {
    this.sugestoesVisiveis = false;
    this.router.navigate(['/busca'], { queryParams: { termo: this.termoBusca } });
  }

  @HostListener('document:click', ['$event'])
  onClickFora(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.sugestoesVisiveis = false;
    }
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
