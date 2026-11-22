import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('o olho alterna a senha entre oculta e visível', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = () => el.querySelector('input[name=senha]') as HTMLInputElement;
    expect(input().type).toBe('password');
    (el.querySelector('.btn-olho') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input().type).toBe('text');
  });

  it('a mensagem de erro some depois de 4 segundos', () => {
    vi.useFakeTimers();
    try {
      component.fazerLogin(); // e-mail vazio -> erro
      expect(component.mensagem).toBe('Email não informado');
      vi.advanceTimersByTime(4000);
      expect(component.mensagem).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicar no campo e sair sem digitar não deixa vermelho', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const email = el.querySelector('input[name=email]') as HTMLInputElement;
    email.dispatchEvent(new Event('focus'));
    email.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el.querySelectorAll('.is-invalid').length).toBe(0);
  });

  it('fica vermelho depois de digitar e apagar', async () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const senha = el.querySelector('input[name=senha]') as HTMLInputElement;
    senha.value = 'abc';
    senha.dispatchEvent(new Event('input'));
    senha.value = '';
    senha.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(senha.classList).toContain('is-invalid');
  });

  it('clicar em Entrar com campos vazios mostra o alerta, mas não deixa os campos vermelhos', () => {
    fixture.detectChanges();
    component.fazerLogin();
    fixture.detectChanges();
    expect(component.mensagem).toBe('Email não informado');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.is-invalid').length).toBe(0);
  });
});
