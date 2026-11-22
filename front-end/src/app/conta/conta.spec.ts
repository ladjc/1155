import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Conta } from './conta';
import { AuthService } from '../services/auth';

describe('Conta', () => {
  let fixture: ComponentFixture<Conta>;
  let navegacoes: any[][];

  beforeEach(async () => {
    navegacoes = [];
    await TestBed.configureTestingModule({
      imports: [Conta],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: (...a: any[]) => { navegacoes.push(a); return Promise.resolve(true); } } },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).clienteLogado.set({
      id: 1, nome: 'Luigi Buono', email: 'luigi@gmail.com', telefone: null, documento: '123', endereco: 'Rua A',
    });
    fixture = TestBed.createComponent(Conta);
    fixture.detectChanges();
  });

  it('mostra os dados do cliente logado', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Luigi Buono');
    expect(texto).toContain('luigi@gmail.com');
    expect(texto).toContain('Não informado'); // telefone vazio
  });

  it('"Alterar cadastro" leva para a tela de cadastro em modo de edição', () => {
    const botao = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Alterar cadastro')) as HTMLButtonElement;
    botao.click();
    expect(navegacoes[0]).toEqual([['/cadastro/editar']]);
  });

  it('"Alterar senha" leva para a tela de troca de senha', () => {
    const botao = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Alterar senha')) as HTMLButtonElement;
    botao.click();
    expect(navegacoes[0]).toEqual([['/conta/senha']]);
  });
});
