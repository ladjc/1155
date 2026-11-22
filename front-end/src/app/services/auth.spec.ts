import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const cliente = { id: 1, nome: 'Luigi Buono', email: 'luigi@gmail.com', telefone: null, documento: '1', endereco: 'Rua A' };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('faz login e guarda o cliente na sessão', () => {
    service.login(' luigi@gmail.com ', 'Senha@123', false).subscribe();

    const req = http.expectOne('/api/cliente/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'luigi@gmail.com', senha: 'Senha@123' });
    req.flush(cliente);

    expect(service.estaLogado()).toBe(true);
    expect(sessionStorage.getItem('clienteLogado')).toContain('Luigi');
    expect(localStorage.getItem('clienteLogado')).toBeNull();
  });

  it('com "manter conectado" guarda no localStorage', () => {
    service.login('luigi@gmail.com', 'Senha@123', true).subscribe();
    http.expectOne('/api/cliente/login').flush(cliente);
    expect(localStorage.getItem('clienteLogado')).toContain('Luigi');
  });

  it('não loga quando o back-end responde 401', () => {
    service.login('luigi@gmail.com', 'errada', false).subscribe({ error: () => {} });
    http.expectOne('/api/cliente/login').flush({ mensagem: 'E-mail ou senha inválidos.' }, { status: 401, statusText: 'Unauthorized' });
    expect(service.estaLogado()).toBe(false);
  });

  it('logout limpa a sessão', () => {
    service.login('luigi@gmail.com', 'Senha@123', true).subscribe();
    http.expectOne('/api/cliente/login').flush(cliente);
    service.logout();
    expect(service.clienteLogado()).toBeNull();
    expect(localStorage.getItem('clienteLogado')).toBeNull();
  });
});
