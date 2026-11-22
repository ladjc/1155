import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Tela aberta pelo ícone de usuário do menu: mostra os dados do cliente logado
@Component({
  imports: [CommonModule],
  selector: 'app-conta',
  styleUrl: './conta.css',
  templateUrl: './conta.html',
})
export class Conta implements OnInit, OnDestroy {
  mensagem: string = "";
  private readonly tempoAlerta = 4000;
  private timerAlerta?: ReturnType<typeof setTimeout>;

  constructor(
    public auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    // Mensagem enviada pela tela de cadastro depois de uma atualização
    const mensagem = isPlatformBrowser(this.platformId) ? history.state?.mensagem : undefined;
    if (typeof mensagem === "string" && mensagem) {
      this.mensagem = mensagem;
      this.timerAlerta = setTimeout(() => {
        this.mensagem = "";
        this.cdr.detectChanges();
      }, this.tempoAlerta);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.timerAlerta);
  }

  alterarCadastro() {
    this.router.navigate(['/cadastro/editar']);
  }

  alterarSenha() {
    this.router.navigate(['/conta/senha']);
  }

  voltar() {
    this.router.navigate(['/']);
  }
}
