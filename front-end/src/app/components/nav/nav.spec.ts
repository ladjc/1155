import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Nav } from './nav';
import { AuthService } from '../../services/auth';

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PRODUTOS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  nome: `Processador ${i + 1}`,
  preco: 1000 + i,
  categoria: 'Processador',
  estoque: 5,
  descricao: 'x',
}));

describe('Nav', () => {
  let component: Nav;
  let fixture: ComponentFixture<Nav>;
  let httpMock: HttpTestingController;
  let navegacoes: any[][];

  beforeEach(async () => {
    navegacoes = [];
    localStorage.removeItem('clienteLogado');
    sessionStorage.removeItem('clienteLogado');

    await TestBed.configureTestingModule({
      imports: [Nav],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            navigate: (...args: any[]) => {
              navegacoes.push(args);
              return Promise.resolve(true);
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Nav);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve navegar para /busca com a categoria escolhida', () => {
    component.buscarCategoria('Fonte');

    expect(navegacoes[0][0]).toEqual(['/busca']);
    expect(navegacoes[0][1]).toEqual({ queryParams: { categoria: 'Fonte' } });
  });

  it('deve buscar o termo aparado ao enviar a barra', () => {
    component.termoBusca = '  ryzen  ';
    component.onBuscar();

    expect(navegacoes[0]).toEqual([['/busca'], { queryParams: { termo: 'ryzen' } }]);
  });

  it('não deve navegar ao enviar uma busca vazia', () => {
    component.termoBusca = '   ';
    component.onBuscar();

    expect(navegacoes).toEqual([]);
  });

  it('deve mostrar até 6 sugestões vindas do back-end', async () => {
    component.termoBusca = 'proc';
    component.onInputBusca();
    await esperar(350); // espera o debounce

    httpMock
      .expectOne((r) => r.url === '/api/produto/busca' && r.params.get('nome') === 'proc')
      .flush(PRODUTOS);

    expect(component.produtosFiltrados.length).toBe(6);
    expect(component.sugestoesVisiveis).toBe(true);
  });

  it('não deve mostrar sugestões quando o back-end falha', async () => {
    component.termoBusca = 'proc';
    component.onInputBusca();
    await esperar(350);

    httpMock
      .expectOne((r) => r.url === '/api/produto/busca')
      .flush('falha', { status: 500, statusText: 'Internal Server Error' });

    expect(component.produtosFiltrados.length).toBe(0);
    expect(component.sugestoesVisiveis).toBe(false);
  });

  describe('conta do cliente', () => {
    const el = () => fixture.nativeElement as HTMLElement;

    const logar = () => {
      TestBed.inject(AuthService).clienteLogado.set({
        id: 1, nome: 'Luigi Buono', email: 'luigi@gmail.com', telefone: null, documento: '1', endereco: 'Rua A',
      });
      fixture.detectChanges();
    };

    it('sem login mostra o botão Login', () => {
      expect(el().textContent).toContain('Login');
      expect(el().querySelector('.nav-usuario')).toBeNull();
      expect(el().querySelector('.nav-logoff')).toBeNull();
    });

    it('logado esconde o Login e mostra usuário + logoff', () => {
      logar();
      expect(el().querySelector('.nav-login-link:not(.nav-usuario)')).toBeNull();
      expect(el().querySelector('.nav-usuario-nome')?.textContent?.trim()).toBe('Luigi');
      expect(el().querySelector('.nav-logoff')).not.toBeNull();
    });

    it('logoff pergunta antes; "Não" mantém o cliente logado', () => {
      logar();
      (el().querySelector('.nav-logoff') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el().querySelector('.modal-saida')?.textContent).toContain('deseja');

      const nao = Array.from(el().querySelectorAll('.modal-saida-btn')).find((b) => b.textContent?.trim() === 'Não');
      (nao as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el().querySelector('.modal-saida')).toBeNull();
      expect(TestBed.inject(AuthService).estaLogado()).toBe(true);
    });

    it('"Sim" faz o logoff e volta para a vitrine', () => {
      logar();
      (el().querySelector('.nav-logoff') as HTMLButtonElement).click();
      fixture.detectChanges();
      (el().querySelector('.modal-saida-sim') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(TestBed.inject(AuthService).estaLogado()).toBe(false);
      expect(el().querySelector('.modal-saida')).toBeNull();
      expect(el().textContent).toContain('Login');
      expect(navegacoes.at(-1)).toEqual([['/']]);
    });
  });
});
