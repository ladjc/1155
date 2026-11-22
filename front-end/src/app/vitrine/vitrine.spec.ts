import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Vitrine } from './vitrine';

describe('Vitrine', () => {
  let component: Vitrine;
  let fixture: ComponentFixture<Vitrine>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vitrine],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Vitrine);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges(); // dispara o ngOnInit e a chamada HTTP
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne('/api/produto/vitrine');
    expect(component).toBeTruthy();
  });

  it('deve carregar a lista quando o back-end responde', () => {
    expect(component.carregando).toBe(true);

    httpMock
      .expectOne('/api/produto/vitrine')
      .flush([{ id: 1, nome: 'Produto teste', preco: 10, categoria: 'Outros', estoque: 1, descricao: 'x' }]);

    expect(component.lista.length).toBe(1);
    expect(component.carregando).toBe(false);
    expect(component.erro).toBe('');
  });

  it('deve exibir erro quando o back-end falha', () => {
    httpMock
      .expectOne('/api/produto/vitrine')
      .flush('falha', { status: 500, statusText: 'Internal Server Error' });

    expect(component.lista.length).toBe(0);
    expect(component.carregando).toBe(false);
    expect(component.erro).not.toBe('');
  });
});
