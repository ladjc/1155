import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProdutoService } from './produto';

describe('ProdutoService', () => {
  let service: ProdutoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProdutoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deve chamar GET /api/produto/vitrine', () => {
    let resultado: any[] = [];
    service.getVitrine().subscribe((p) => (resultado = p));

    const req = httpMock.expectOne('/api/produto/vitrine');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, nome: 'Teste' }]);

    expect(resultado.length).toBe(1);
  });
});
