import { ChangeDetectorRef, Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TimeoutError } from 'rxjs';
import { AuthService } from '../services/auth';
import { PADRAO_SENHA, requisitosFaltandoSenha } from '../utils/regras-senha';
import { campoInvalido, campoValido } from '../utils/validacao-campo';

/**
 * Recuperar senha - última etapa: depois de confirmar o código, a pessoa chega
 * aqui com a autorização (token) e cria a nova senha.
 */
@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-redefinir-senha',
  styleUrl: './redefinir-senha.css',
  templateUrl: './redefinir-senha.html',
})
export class RedefinirSenha implements OnInit, OnDestroy {
  novaSenha: string = "";
  confirmacao: string = "";
  mostrarNovaSenha: boolean = false;
  mostrarConfirmacao: boolean = false;
  novaSenhaEmFoco: boolean = false;

  email: string = "";
  semAutorizacao: boolean = false; // abriu a página sem passar pelo código

  mensagem: string = "";
  enviando: boolean = false;
  readonly padraoSenha = PADRAO_SENHA;

  private token: string = "";
  private readonly tempoAlerta = 4000;
  private timerAlerta?: ReturnType<typeof setTimeout>;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    // A autorização chega pela navegação da tela "Esqueci a senha"
    const estado = isPlatformBrowser(this.platformId) ? history.state : null;
    this.token = typeof estado?.token === "string" ? estado.token : "";
    this.email = typeof estado?.email === "string" ? estado.email : "";
    this.semAutorizacao = !this.token;
  }

  campoInvalido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoInvalido(campo, elemento);
  }

  campoValido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoValido(campo, elemento);
  }

  get requisitosFaltando(): string[] {
    return requisitosFaltandoSenha(this.novaSenha);
  }

  // A confirmação só fica vermelha depois de digitada (e com o cursor fora dela)
  confirmacaoDiferente(campo: NgModel, elemento?: HTMLElement): boolean {
    return !!campo.dirty && !!campo.touched && document.activeElement !== elemento
      && !!this.confirmacao && this.confirmacao !== this.novaSenha;
  }

  salvar() {
    if (this.enviando || this.semAutorizacao) {
      return;
    }
    if (!this.novaSenha || !this.confirmacao) {
      this.mostrar("Preencha todos os campos obrigatórios (*).");
      return;
    }
    if (this.requisitosFaltando.length > 0) {
      this.mostrar("A nova senha não atende a todos os requisitos.");
      return;
    }
    if (this.novaSenha !== this.confirmacao) {
      this.mostrar("A confirmação não é igual à nova senha.");
      return;
    }

    this.enviando = true;
    this.limparAlerta();
    this.auth.redefinirSenhaRecuperacao(this.token, this.novaSenha).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/login'], {
          state: { mensagem: "Senha redefinida com sucesso! Entre com a nova senha." },
        });
      },
      error: (erro) => {
        this.enviando = false;
        // Ex.: "O prazo para redefinir a senha expirou. Solicite um novo código."
        this.mostrar(this.montarMensagemErro(erro));
      },
    });
  }

  recomecar() {
    this.router.navigate(['/rec-senha']);
  }

  // ---------- Alertas temporários (4 s) ----------
  private mostrar(mensagem: string) {
    this.limparAlerta();
    this.cdr.detectChanges();
    this.mensagem = mensagem;
    this.cdr.detectChanges();
    this.timerAlerta = setTimeout(() => {
      this.mensagem = "";
      this.cdr.detectChanges();
    }, this.tempoAlerta);
  }

  private limparAlerta() {
    clearTimeout(this.timerAlerta);
    this.mensagem = "";
  }

  ngOnDestroy() {
    clearTimeout(this.timerAlerta);
  }

  private montarMensagemErro(erro: unknown): string {
    if (erro instanceof TimeoutError) {
      return "O servidor demorou para responder. Tente novamente.";
    }
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) {
        return "Não foi possível conectar ao servidor.";
      }
      if (typeof erro.error?.mensagem === "string") {
        return erro.error.mensagem;
      }
    }
    return "Não foi possível redefinir a senha.";
  }
}
