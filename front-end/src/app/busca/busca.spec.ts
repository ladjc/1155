import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Busca } from './busca';

const RYZEN = { id: 1, nome: 'Processador AMD Ryzen 7', preco: 2000, categoria: 'Processador', estoque: 5, descricao: 'a' };
const INTEL = { id: 2, nome: 'Processador Intel Core i5', preco: 1000, categoria: 'Processador', estoque: 3, descricao: 'b' };
const SEM_ESTOQUE = { id: 3, nome: 'Processador Antigo', preco: 100, categoria: 'Processador', estoque: 0, descricao: 'c' };

describe('Busca', () => {
  let component: Busca;
  let fixture: ComponentFixture<Busca>;
  let httpMock: HttpTestingController;

  // Monta o componente simulando os parâmetros da URL (?termo=... ou ?categoria=...)
  function montar(params: Record<string, string>) {
    TestBed.configureTestingModule({
      imports: [Busca],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(params)) } },
      ],
    });

    fixture = TestBed.createComponent(Busca);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // dispara o ngOnInit e a busca
  }

  const requisicao = (chave: 'termo' | 'categoria', valor: string) =>
    httpMock.expectOne((r) => r.url === '/api/produto/busca' && r.params.get(chave) === valor);

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    montar({});
    expect(component).toBeTruthy();
  });

  it('não deve chamar o back-end quando não há termo nem categoria', () => {
    montar({});

    httpMock.expectNone('/api/produto/busca');
    expect(component.carregando).toBe(false);
    expect(component.produtosEncontrados.length).toBe(0);
  });

  it('deve buscar por termo e depois buscar os semelhantes da categoria', () => {
    montar({ termo: 'ryzen' });
    expect(component.carregando).toBe(true);

    requisicao('termo', 'ryzen').flush([RYZEN, SEM_ESTOQUE]);
    requisicao('categoria', 'Processador').flush([RYZEN, INTEL, SEM_ESTOQUE]);

    expect(component.carregando).toBe(false);
    expect(component.produtosEncontrados.length).toBe(1); // sem estoque é ignorado
    expect(component.produtosSemelhantes.length).toBe(1); // só o Intel
    expect(component.erro).toBe('');
  });

  it('deve buscar por categoria', () => {
    montar({ categoria: 'Processador' });

    requisicao('categoria', 'Processador').flush([RYZEN, INTEL]);

    expect(component.termoBusca).toBe('Processador');
    expect(component.produtosEncontrados.length).toBe(2);
    expect(component.produtosSemelhantes.length).toBe(0);
  });

  it('deve exibir erro quando o back-end falha', () => {
    montar({ termo: 'ryzen' });

    requisicao('termo', 'ryzen').flush('falha', { status: 500, statusText: 'Internal Server Error' });

    expect(component.carregando).toBe(false);
    expect(component.erro).not.toBe('');
    expect(component.produtosEncontrados.length).toBe(0);
  });

  it('deve refazer a busca ao tentar novamente', () => {
    montar({ termo: 'ryzen' });
    requisicao('termo', 'ryzen').flush('falha', { status: 500, statusText: 'Internal Server Error' });

    component.carregarProdutos();

    expect(component.carregando).toBe(true);
    expect(component.erro).toBe('');
    requisicao('termo', 'ryzen').flush([]);
    expect(component.carregando).toBe(false);
  });
});
