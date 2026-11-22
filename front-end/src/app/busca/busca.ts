import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, TimeoutError, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Produto } from '../models/produto';
import { ItemCesta } from '../models/item-cesta';
import { ProdutoService } from '../services/produto';

interface ResultadoBusca {
  encontrados: Produto[];
  semelhantes: Produto[];
}

const SEM_RESULTADO: ResultadoBusca = { encontrados: [], semelhantes: [] };

@Component({
  imports: [CommonModule],
  selector: 'app-busca',
  styleUrl: './busca.css',
  templateUrl: './busca.html',
})
export class Busca implements OnInit {
  mensagemAlerta: string = '';
  mostrarAlerta: boolean = false;
  private alertaTimeout: any;

  carregando: boolean = false;
  erro: string = '';

  termoBusca: string = '';
  private categoria: string = '';
  produtosEncontrados: Produto[] = [];
  produtosSemelhantes: Produto[] = [];

  // Cada vez que este Subject emite, uma nova busca é feita no back-end
  private disparoBusca$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private produtoService: ProdutoService,
  ) {}

  ngOnInit(): void {
    this.disparoBusca$
      .pipe(
        tap(() => {
          this.carregando = true;
          this.erro = '';
          this.cdr.markForCheck();
        }),
        // switchMap cancela a busca anterior se o usuário pesquisar outra coisa antes dela terminar
        switchMap(() =>
          this.buscarNoBackend().pipe(
            catchError((e) => {
              this.erro = this.montarMensagemErro(e);
              return of(SEM_RESULTADO);
            }),
          ),
        ),
      )
      .subscribe((resultado) => {
        this.produtosEncontrados = resultado.encontrados;
        this.produtosSemelhantes = resultado.semelhantes;
        this.carregando = false;
        this.cdr.detectChanges();
      });

    // A busca é refeita sempre que o termo/categoria da URL mudar
    this.route.queryParamMap.subscribe((params) => {
      this.categoria = params.get('categoria') ?? '';
      this.termoBusca = this.categoria || (params.get('termo') ?? '');
      this.disparoBusca$.next();
    });
  }

  // Usado pelo botão "Tentar novamente"
  carregarProdutos(): void {
    this.disparoBusca$.next();
  }

  private buscarNoBackend(): Observable<ResultadoBusca> {
    const termo = this.termoBusca.trim();

    if (!termo) {
      return of(SEM_RESULTADO);
    }

    // Busca por categoria (botões da nav): só os produtos da categoria
    if (this.categoria) {
      return this.produtoService.buscar({ categoria: this.categoria }).pipe(
        map((lista) => ({ encontrados: this.soDisponiveis(lista), semelhantes: [] })),
      );
    }

    // Busca por termo: primeiro os encontrados, depois os semelhantes (mesma categoria)
    return this.produtoService.buscar({ termo }).pipe(
      map((lista) => this.soDisponiveis(lista)),
      switchMap((encontrados) =>
        this.buscarSemelhantes(encontrados).pipe(
          map((semelhantes) => ({ encontrados, semelhantes })),
        ),
      ),
    );
  }

  // Produtos das mesmas categorias dos encontrados, exceto os que já foram encontrados
  private buscarSemelhantes(encontrados: Produto[]): Observable<Produto[]> {
    const categorias = [...new Set(encontrados.map((p) => p.categoria))];

    if (categorias.length === 0) {
      return of([]);
    }

    const idsEncontrados = new Set(encontrados.map((p) => p.id));

    return forkJoin(categorias.map((c) => this.produtoService.buscar({ categoria: c }))).pipe(
      map((listas) => this.soDisponiveis(listas.flat()).filter((p) => !idsEncontrados.has(p.id))),
      // Os semelhantes são um extra: se falharem, a página mostra só os encontrados
      catchError(() => of([] as Produto[])),
    );
  }

  private soDisponiveis(lista: Produto[] | null): Produto[] {
    return (lista ?? []).filter((p) => p.estoque > 0);
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
        return 'Serviço de busca não encontrado (404).';
      }
      if (e.status >= 500) {
        return 'Erro no servidor ao buscar os produtos. Tente novamente mais tarde.';
      }
    }
    return 'Não foi possível buscar os produtos.';
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

    sessionStorage.setItem('mensagemCarrinho', 'Produto adicionado com sucesso');
    this.router.navigate(['/cesta']);
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
