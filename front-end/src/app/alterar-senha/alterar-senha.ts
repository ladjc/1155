import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TimeoutError } from 'rxjs';
import { AuthService } from '../services/auth';
import { PADRAO_SENHA, requisitosFaltandoSenha } from '../utils/regras-senha';
import { campoInvalido, campoValido } from '../utils/validacao-campo';

// Tela "Alterar senha" (aberta em Minha conta): troca só a senha, exigindo a atual
@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-alterar-senha',
  styleUrl: './alterar-senha.css',
  templateUrl: './alterar-senha.html',
})
export class AlterarSenha implements OnDestroy {
  senhaAtual: string = "";
  novaSenha: string = "";
  confirmacao: string = "";

  mostrarSenhaAtual: boolean = false;
  mostrarNovaSenha: boolean = false;
  mostrarConfirmacao: boolean = false;
  novaSenhaEmFoco: boolean = false;

  mensagem: string = "";
  enviando: boolean = false;
  readonly padraoSenha = PADRAO_SENHA;

  private readonly tempoAlerta = 4000;
  private timerAlerta?: ReturnType<typeof setTimeout>;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  campoInvalido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoInvalido(campo, elemento);
  }

  campoValido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoValido(campo, elemento);
  }

  get requisitosFaltando(): string[] {
    return requisitosFaltandoSenha(this.novaSenha);
  }

  // A confirmação só fica vermelha depois de digitada (e com o cursor fora dela),
  // se for diferente da nova senha
  confirmacaoDiferente(campo: NgModel, elemento?: HTMLElement): boolean {
    return !!campo.dirty && !!campo.touched && document.activeElement !== elemento
      && !!this.confirmacao && this.confirmacao !== this.novaSenha;
  }

  salvar() {
    if (this.enviando) {
      return;
    }
    if (!this.senhaAtual || !this.novaSenha || !this.confirmacao) {
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
    if (this.novaSenha === this.senhaAtual) {
      this.mostrar("A nova senha deve ser diferente da senha atual.");
      return;
    }

    const id = this.auth.clienteLogado()?.id;
    if (!id) {
      this.router.navigate(['/login']);
      return;
    }

    this.enviando = true;
    this.limparAlerta();
    this.auth.alterarSenha(id, { senhaAtual: this.senhaAtual, novaSenha: this.novaSenha }).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/conta'], { state: { mensagem: "Senha alterada com sucesso!" } });
      },
      error: (erro) => {
        this.enviando = false;
        // Ex.: 401 "Senha atual incorreta."
        this.mostrar(this.montarMensagemErro(erro));
      },
    });
  }

  voltar() {
    this.router.navigate(['/conta']);
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
    return "Não foi possível alterar a senha.";
  }
}
