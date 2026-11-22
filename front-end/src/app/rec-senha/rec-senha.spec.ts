import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RecSenha } from './rec-senha';

describe('RecSenha', () => {
  let component: RecSenha;
  let fixture: ComponentFixture<RecSenha>;
  let http: HttpTestingController;
  let navegacoes: any[][];

  beforeEach(async () => {
    navegacoes = [];
    await TestBed.configureTestingModule({
      imports: [RecSenha],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: (...a: any[]) => { navegacoes.push(a); return Promise.resolve(true); } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecSenha);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const emailEncontrado = () => {
    component.email = 'maria@teste.com';
    component.recuperar();
    http.expectOne('/api/cliente/recuperar-senha/verificar').flush({ mensagem: 'Código enviado.', email: 'maria@teste.com' });
    fixture.detectChanges();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('não chama o back-end com e-mail vazio ou inválido', () => {
    component.recuperar();
    expect(component.mensagem).toBe('Informe o seu e-mail.');

    component.email = 'maria@';
    component.recuperar();
    expect(component.mensagem).toBe('Informe um e-mail válido (ex.: nome@email.com).');
  });

  it('avisa quando o e-mail não está cadastrado', () => {
    component.email = 'ninguem@teste.com';
    component.recuperar();
    http.expectOne('/api/cliente/recuperar-senha/verificar')
      .flush({ mensagem: 'Não existe cadastro com este e-mail.' }, { status: 404, statusText: 'Not Found' });

    expect(component.emailVerificado).toBe('');
    expect(component.mensagem).toBe('Não existe cadastro com este e-mail.');
  });

  it('com o e-mail encontrado, mostra o aviso e o campo do código', () => {
    emailEncontrado();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Um código foi enviado para o e-mail informado, digite ele no campo abaixo.');
    expect(el.querySelector('input[name=codigo]')).not.toBeNull();
  });

  it('o campo do código aceita só números, no máximo 6', () => {
    component.aoDigitarCodigo('12a3-4567');
    expect(component.codigo).toBe('123456');
  });

  it('não confirma código incompleto', () => {
    emailEncontrado();
    component.codigo = '123';
    component.confirmarCodigo();
    expect(component.mensagem).toBe('Digite o código de 6 dígitos.');
  });

  it('código certo leva para a tela de nova senha com a autorização', () => {
    emailEncontrado();
    component.codigo = '123456';
    component.confirmarCodigo();

    const req = http.expectOne('/api/cliente/recuperar-senha/confirmar');
    expect(req.request.body).toEqual({ email: 'maria@teste.com', codigo: '123456' });
    req.flush({ token: 'abc' });

    expect(navegacoes[0]).toEqual([['/redefinir-senha'], { state: { token: 'abc', email: 'maria@teste.com' } }]);
  });

  it('código errado mostra a mensagem do back-end', () => {
    emailEncontrado();
    component.codigo = '000000';
    component.confirmarCodigo();
    http.expectOne('/api/cliente/recuperar-senha/confirmar')
      .flush({ mensagem: 'Código incorreto. Restam 4 tentativas.' }, { status: 400, statusText: 'Bad Request' });

    expect(component.mensagem).toBe('Código incorreto. Restam 4 tentativas.');
    expect(navegacoes.length).toBe(0);
  });

  it('reenviar pede um código novo para o mesmo e-mail', () => {
    emailEncontrado();
    component.reenviarCodigo();
    const req = http.expectOne('/api/cliente/recuperar-senha/verificar');
    expect(req.request.body).toEqual({ email: 'maria@teste.com' });
    req.flush({ mensagem: 'Código enviado.', email: 'maria@teste.com' });
    expect(component.mensagem).toBe('Um novo código foi enviado!');
  });
});
