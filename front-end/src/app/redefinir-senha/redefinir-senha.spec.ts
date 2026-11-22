import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RedefinirSenha } from './redefinir-senha';

describe('RedefinirSenha', () => {
  let component: RedefinirSenha;
  let fixture: ComponentFixture<RedefinirSenha>;
  let http: HttpTestingController;
  let navegacoes: any[][];

  const criar = async (estado: any) => {
    history.replaceState(estado, '');
    navegacoes = [];
    await TestBed.configureTestingModule({
      imports: [RedefinirSenha],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: (...a: any[]) => { navegacoes.push(a); return Promise.resolve(true); } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RedefinirSenha);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  };

  afterEach(() => {
    http.verify();
    history.replaceState(null, '');
  });

  it('sem autorização, pede para começar pelo "Esqueci a senha"', async () => {
    await criar(null);
    expect(component.semAutorizacao).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[name=txtNovaSenha]')).toBeNull();
  });

  it('com autorização, mostra os campos de nova senha', async () => {
    await criar({ token: 'abc', email: 'maria@teste.com' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[name=txtNovaSenha]')).not.toBeNull();
    expect(el.querySelector('[name=txtConfirmacao]')).not.toBeNull();
    expect(el.textContent).toContain('maria@teste.com');
  });

  it('confere requisitos e confirmação antes de enviar', async () => {
    await criar({ token: 'abc' });
    component.novaSenha = 'fraca';
    component.confirmacao = 'fraca';
    component.salvar();
    expect(component.mensagem).toBe('A nova senha não atende a todos os requisitos.');

    component.novaSenha = 'Nova@4567';
    component.confirmacao = 'Nova@4568';
    component.salvar();
    expect(component.mensagem).toBe('A confirmação não é igual à nova senha.');
  });

  it('salva a nova senha e volta para o login com aviso', async () => {
    await criar({ token: 'abc' });
    component.novaSenha = 'Nova@4567';
    component.confirmacao = 'Nova@4567';
    component.salvar();

    const req = http.expectOne('/api/cliente/recuperar-senha/redefinir');
    expect(req.request.body).toEqual({ token: 'abc', novaSenha: 'Nova@4567' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(navegacoes[0]).toEqual([['/login'], { state: { mensagem: 'Senha redefinida com sucesso! Entre com a nova senha.' } }]);
  });

  it('mostra o erro do back-end (ex.: prazo expirado)', async () => {
    await criar({ token: 'abc' });
    component.novaSenha = 'Nova@4567';
    component.confirmacao = 'Nova@4567';
    component.salvar();
    http.expectOne('/api/cliente/recuperar-senha/redefinir').flush(
      { mensagem: 'O prazo para redefinir a senha expirou. Solicite um novo código.' }, { status: 400, statusText: 'Bad Request' });
    expect(component.mensagem).toBe('O prazo para redefinir a senha expirou. Solicite um novo código.');
  });
});
