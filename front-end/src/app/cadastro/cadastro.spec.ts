import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Cadastro } from './cadastro';
import { AuthService } from '../services/auth';

describe('Cadastro', () => {
  let component: Cadastro;
  let fixture: ComponentFixture<Cadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [Cadastro],
    }).compileComponents();

    fixture = TestBed.createComponent(Cadastro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('requisitos da senha', () => {
    const faltando = (senha: string) => {
      component.obj.senha = senha;
      return component.requisitosFaltando;
    };

    it('senha vazia lista todos os requisitos', () => {
      expect(faltando('').length).toBe(5);
    });

    it('remove só o que já foi atendido', () => {
      const r = faltando('abcdefgh');
      expect(r.some((x) => x.includes('8 caracteres'))).toBe(false);
      expect(r.some((x) => x.includes('minúscula'))).toBe(false);
      expect(r).toContain('Uma letra maiúscula');
      expect(r).toContain('Um número');
    });

    it('o requisito volta quando é apagado', () => {
      expect(faltando('Abcdef1@')).toEqual([]);
      expect(faltando('Abcdef1')).toEqual(['Pelo menos 8 caracteres (falta 1)', 'Um caractere especial (@$!%*?&)']);
    });

    it('avisa sobre caracteres não permitidos', () => {
      expect(faltando('Abcdef1@ #')).toEqual(['Remover caracteres não permitidos: espaço #']);
    });

    it('só mostra os requisitos com o campo em foco', () => {
      const el = fixture.nativeElement as HTMLElement;
      const input = el.querySelector('input[name=txtSenha]') as HTMLInputElement;
      expect(el.querySelector('.requisitos-senha')).toBeNull();
      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(el.querySelector('.requisitos-senha')).not.toBeNull();
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(el.querySelector('.requisitos-senha')).toBeNull();
    });
  });

  it('o olho alterna a senha entre oculta e visível', () => {
    const el = fixture.nativeElement as HTMLElement;
    const input = () => el.querySelector('input[name=txtSenha]') as HTMLInputElement;
    expect(input().type).toBe('password');
    (el.querySelector('.btn-olho') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input().type).toBe('text');
  });

  it('a mensagem de erro some depois de 4 segundos', () => {
    vi.useFakeTimers();
    try {
      component.gravar(); // campos vazios -> erro
      expect(component.mensagem).toContain('Preencha');
      vi.advanceTimersByTime(3900);
      expect(component.mensagem).not.toBe('');
      vi.advanceTimersByTime(200);
      expect(component.mensagem).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('depois de cadastrar, vai para a tela de login com o aviso de sucesso', async () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const http = TestBed.inject(HttpTestingController);
    const el = fixture.nativeElement as HTMLElement;
    const digitar = async (nome: string, valor: string) => {
      const campo = el.querySelector(`[name=${nome}]`) as HTMLInputElement;
      campo.value = valor;
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
    };
    await digitar('txtNome', 'Maria Souza');
    await digitar('txtEmail', 'maria@teste.com');
    await digitar('txtDocumento', '111');
    await digitar('txtLogradouro', 'Rua M');
    await digitar('txtSenha', 'Senha@123');

    component.gravar();
    const req = http.expectOne('/api/cliente');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, nome: 'Maria Souza', email: 'maria@teste.com', telefone: null, documento: '111', endereco: 'Rua M' });

    expect(navegar).toHaveBeenCalledWith(['/login'], { state: { mensagem: 'Cadastro feito com sucesso! Faça seu login.' } });
    http.verify();
  });

  describe('alertas vermelhos dos campos', () => {
    const el = () => fixture.nativeElement as HTMLElement;
    const campo = (nome: string) => el().querySelector(`[name=${nome}]`) as HTMLInputElement;
    const digitar = async (nome: string, valor: string) => {
      campo(nome).value = valor;
      campo(nome).dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
    };
    const sair = (nome: string) => {
      campo(nome).dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    };

    it('não aparecem ao abrir a tela', () => {
      fixture.detectChanges();
      expect(el().querySelectorAll('.is-invalid').length).toBe(0);
    });

    it('clicar no campo e sair sem digitar não deixa vermelho', () => {
      campo('txtNome').dispatchEvent(new Event('focus'));
      sair('txtNome');
      expect(campo('txtNome').classList).not.toContain('is-invalid');
    });

    it('digitar e apagar tudo deixa o campo obrigatório vermelho na hora', async () => {
      await digitar('txtNome', 'Lu');
      await digitar('txtNome', '');
      expect(campo('txtNome').classList).toContain('is-invalid');
    });

    it('erro de formato só aparece ao sair do campo', async () => {
      await digitar('txtEmail', 'maria@');
      expect(campo('txtEmail').classList).not.toContain('is-invalid');
      sair('txtEmail');
      expect(campo('txtEmail').classList).toContain('is-invalid');
    });

    it('clicar em Cadastrar com campos vazios não deixa os campos vermelhos', () => {
      component.gravar();
      fixture.detectChanges();
      expect(el().querySelectorAll('.is-invalid').length).toBe(0);
      expect(component.mensagem).toContain('Preencha');
    });
  });
});

describe('Cadastro em modo de edição', () => {
  let component: Cadastro;
  let fixture: ComponentFixture<Cadastro>;
  let http: HttpTestingController;
  let navegacoes: any[][];
  const cliente = { id: 7, nome: 'Luigi Buono', email: 'luigi@gmail.com', telefone: null, documento: '123', endereco: 'Rua A' };

  beforeEach(async () => {
    navegacoes = [];
    await TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { edicao: true } } } },
        { provide: Router, useValue: { navigate: (...a: any[]) => { navegacoes.push(a); return Promise.resolve(true); } } },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).clienteLogado.set(cliente);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Cadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const el = () => fixture.nativeElement as HTMLElement;
  // Simula a digitação no campo (como a pessoa faria), o que também atualiza a tela
  const digitar = async (nome: string, valor: string) => {
    const campo = el().querySelector(`[name=${nome}]`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('preenche o formulário e não mostra campos de senha', () => {
    expect(component.obj.nome).toBe('Luigi Buono');
    expect(component.obj.email).toBe('luigi@gmail.com');
    expect(el().querySelector('[name=txtSenha]')).toBeNull();
    expect(el().querySelector('[name=txtSenhaAtual]')).toBeNull();
    expect(el().textContent).toContain('Salvar alterações');
  });

  it('avisa quando nada foi alterado', () => {
    component.gravar();
    expect(component.mensagem).toBe('Nenhuma alteração para salvar.');
  });

  it('altera nome, telefone e endereço sem pedir a senha atual', async () => {
    await digitar('txtNome', 'Luigi B');
    await digitar('txtTelefone', '91234-5678');
    await digitar('txtLogradouro', 'Rua B');
    expect(el().querySelector('[name=txtSenhaAtual]')).toBeNull();
    component.gravar();

    const req = http.expectOne('/api/cliente/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      nome: 'Luigi B', email: 'luigi@gmail.com', telefone: '91234-5678', documento: '123', endereco: 'Rua B',
      senhaAtual: null,
    });
    req.flush({ ...cliente, nome: 'Luigi B', telefone: '91234-5678', endereco: 'Rua B' });

    expect(TestBed.inject(AuthService).clienteLogado()?.nome).toBe('Luigi B');
    expect(navegacoes[0][0]).toEqual(['/conta']);
  });

  it('pede a senha atual só quando o e-mail ou o documento mudam', async () => {
    await digitar('txtEmail', 'novo@gmail.com');
    expect(el().querySelector('[name=txtSenhaAtual]')).not.toBeNull();
    expect(el().textContent).toContain('confirme com a sua senha atual');

    component.gravar();
    expect(component.mensagem).toBe('Para alterar o e-mail ou o documento, informe a sua senha atual.');

    await digitar('txtEmail', 'luigi@gmail.com');
    expect(el().querySelector('[name=txtSenhaAtual]')).toBeNull();

    await digitar('txtDocumento', '999');
    expect(el().querySelector('[name=txtSenhaAtual]')).not.toBeNull();

    await digitar('txtDocumento', '123');
    expect(el().querySelector('[name=txtSenhaAtual]')).toBeNull();
  });

  it('envia a senha atual junto quando o e-mail muda', async () => {
    await digitar('txtEmail', 'novo@gmail.com');
    await digitar('txtSenhaAtual', 'Senha@123');
    component.gravar();

    const req = http.expectOne('/api/cliente/7');
    expect(req.request.body.senhaAtual).toBe('Senha@123');
    expect(req.request.body.email).toBe('novo@gmail.com');
    req.flush({ ...cliente, email: 'novo@gmail.com' });
  });

  it('mostra a mensagem do back-end quando o e-mail já é de outro cliente', async () => {
    await digitar('txtEmail', 'maria@x.com');
    await digitar('txtSenhaAtual', 'Senha@123');
    component.gravar();

    http.expectOne('/api/cliente/7').flush({ mensagem: 'E-mail já cadastrado.' }, { status: 409, statusText: 'Conflict' });
    expect(component.mensagem).toBe('E-mail já cadastrado.');
  });
});
