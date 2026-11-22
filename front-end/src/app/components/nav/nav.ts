import { ChangeDetectorRef, Component, ElementRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { Produto } from '../../models/produto';
import { ProdutoService } from '../../services/produto';

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

  // Recebe o que o usuário digita; a chamada ao back-end só acontece depois de uma pausa na digitação
  private entradaBusca$ = new Subject<string>();

  // Evita que uma resposta atrasada reabra a lista depois de o usuário buscar ou clicar fora
  private podeSugerir = false;

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private produtoService: ProdutoService,
    private cdr: ChangeDetectorRef,
  ) {
    this.entradaBusca$
      .pipe(
        debounceTime(300),
        // switchMap cancela a chamada anterior se o usuário continuar digitando
        switchMap((termo) => {
          if (!termo) {
            return of<Produto[]>([]);
          }
          // Sugestões são um extra: se der erro, apenas não mostra a lista
          return this.produtoService.buscar({ termo }).pipe(catchError(() => of<Produto[]>([])));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((lista) => {
        this.produtosFiltrados = (lista ?? []).slice(0, 6);
        this.sugestoesVisiveis = this.podeSugerir && this.produtosFiltrados.length > 0;
        this.cdr.detectChanges();
      });
  }

  onInputBusca(): void {
    const termo = this.termoBusca.trim();
    this.podeSugerir = true;

    if (!termo) {
      this.produtosFiltrados = [];
      this.sugestoesVisiveis = false;
    }

    this.entradaBusca$.next(termo);
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
    this.podeSugerir = false;
    this.sugestoesVisiveis = false;
    this.router.navigate(['/busca'], { queryParams: { termo: this.termoBusca } });
  }

  // A página /busca é quem consulta o endpoint /api/produto/busca com a categoria
  buscarCategoria(categoria: string): void {
    this.podeSugerir = false;
    this.sugestoesVisiveis = false;
    this.router.navigate(['/busca'], { queryParams: { categoria } });
  }

  @HostListener('document:click', ['$event'])
  onClickFora(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.podeSugerir = false;
      this.sugestoesVisiveis = false;
    }
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
