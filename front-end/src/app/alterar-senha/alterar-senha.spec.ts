import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AlterarSenha } from './alterar-senha';
import { AuthService } from '../services/auth';

describe('AlterarSenha', () => {
  let component: AlterarSenha;
  let fixture: ComponentFixture<AlterarSenha>;
  let http: HttpTestingController;
  let navegacoes: any[][];

  beforeEach(async () => {
    navegacoes = [];
    await TestBed.configureTestingModule({
      imports: [AlterarSenha],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: (...a: any[]) => { navegacoes.push(a); return Promise.resolve(true); } } },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).clienteLogado.set({
      id: 7, nome: 'Luigi', email: 'luigi@gmail.com', telefone: null, documento: '1', endereco: 'Rua A',
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AlterarSenha);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const preencher = (atual: string, nova: string, confirmacao: string) => {
    component.senhaAtual = atual;
    component.novaSenha = nova;
    component.confirmacao = confirmacao;
  };

  it('tem os campos senha atual, nova senha e confirmação, cada um com o olho', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[name=txtSenhaAtual]')).not.toBeNull();
    expect(el.querySelector('[name=txtNovaSenha]')).not.toBeNull();
    expect(el.querySelector('[name=txtConfirmacao]')).not.toBeNull();
    expect(el.querySelectorAll('.btn-olho').length).toBe(3);
    expect(el.querySelectorAll('.is-invalid').length).toBe(0);
  });

  it('exige todos os campos', () => {
    component.salvar();
    expect(component.mensagem).toContain('Preencha');
  });

  it('aplica a regra de senha e confere a confirmação', () => {
    preencher('Senha@123', 'fraca', 'fraca');
    component.salvar();
    expect(component.mensagem).toBe('A nova senha não atende a todos os requisitos.');

    preencher('Senha@123', 'Nova@4567', 'Nova@4568');
    component.salvar();
    expect(component.mensagem).toBe('A confirmação não é igual à nova senha.');

    preencher('Senha@123', 'Senha@123', 'Senha@123');
    component.salvar();
    expect(component.mensagem).toBe('A nova senha deve ser diferente da senha atual.');
  });

  it('envia só a senha atual e a nova senha, e volta para Minha conta', () => {
    preencher('Senha@123', 'Nova@4567', 'Nova@4567');
    component.salvar();

    const req = http.expectOne('/api/cliente/7/senha');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ senhaAtual: 'Senha@123', novaSenha: 'Nova@4567' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(navegacoes[0][0]).toEqual(['/conta']);
    expect(navegacoes[0][1]).toEqual({ state: { mensagem: 'Senha alterada com sucesso!' } });
  });

  it('mostra "Senha atual incorreta." vinda do back-end', () => {
    preencher('Errada@1', 'Nova@4567', 'Nova@4567');
    component.salvar();
    http.expectOne('/api/cliente/7/senha').flush({ mensagem: 'Senha atual incorreta.' }, { status: 401, statusText: 'Unauthorized' });
    expect(component.mensagem).toBe('Senha atual incorreta.');
  });
});
