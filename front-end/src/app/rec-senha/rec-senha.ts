import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TimeoutError } from 'rxjs';
import { AuthService } from '../services/auth';
import { campoInvalido, campoValido } from '../utils/validacao-campo';

/**
 * Recuperar senha ("Esqueci a senha"):
 *  1. a pessoa informa o e-mail; o back-end confere se está cadastrado e envia um código;
 *  2. a pessoa digita o código de 6 dígitos;
 *  3. com o código certo, vai para /redefinir-senha para criar a nova senha.
 */
@Component({
  imports: [CommonModule,FormsModule],
  selector: 'app-rec-senha',
  styleUrl: './rec-senha.css',
  templateUrl: './rec-senha.html',
})
export class RecSenha implements OnDestroy {
  mensagem: string = "";
  erro: boolean = false;
  email: string = "";
  enviando: boolean = false;
  emailVerificado: string = "";   // preenchido quando o back-end confirma o e-mail e envia o código
  codigo: string = "";

  // Mesma regra de e-mail do cadastro e do back-end
  readonly regraEmail = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
  private readonly regexEmail = new RegExp(`^${this.regraEmail}$`);

  private readonly tempoAlerta = 4000;
  private timerAlerta?: ReturnType<typeof setTimeout>;

  constructor(private auth: AuthService, private cdr: ChangeDetectorRef, private router: Router) {}

  campoInvalido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoInvalido(campo, elemento);
  }

  campoValido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoValido(campo, elemento);
  }

  recuperar(){
    if (this.enviando) {
      return;
    }
    const email = this.email.trim();
    if (!email) {
      this.mostrar("Informe o seu e-mail.", true);
      return;
    }
    if (!this.regexEmail.test(email)) {
      this.mostrar("Informe um e-mail válido (ex.: nome@email.com).", true);
      return;
    }

    this.enviarCodigo(email, "Código enviado!");
  }

  // Pede (ou pede de novo) o código ao back-end; um código novo invalida o anterior
  private enviarCodigo(email: string, mensagemSucesso: string) {
    this.enviando = true;
    this.limparAlerta();

    this.auth.verificarEmailRecuperacao(email).subscribe({
      next: (resposta) => {
        this.enviando = false;
        this.emailVerificado = resposta.email;
        this.codigo = "";
        this.mostrar(mensagemSucesso, false);
      },
      error: (erro) => {
        this.enviando = false;
        // Ex.: 404 "Não existe cadastro com este e-mail."
        this.mostrar(this.montarMensagemErro(erro), true);
      },
    });
  }

  reenviarCodigo(){
    if (!this.enviando && this.emailVerificado) {
      this.enviarCodigo(this.emailVerificado, "Um novo código foi enviado!");
    }
  }

  // Campo do código: aceita só números, no máximo 6 (letras somem da tela também)
  aoDigitarCodigo(valor: string, campo?: HTMLInputElement){
    this.codigo = (valor ?? "").replace(/\D/g, "").slice(0, 6);
    if (campo && campo.value !== this.codigo) {
      campo.value = this.codigo;
    }
  }

  confirmarCodigo(){
    if (this.enviando) {
      return;
    }
    if (!/^\d{6}$/.test(this.codigo)) {
      this.mostrar("Digite o código de 6 dígitos.", true);
      return;
    }

    this.enviando = true;
    this.limparAlerta();
    this.auth.confirmarCodigoRecuperacao(this.emailVerificado, this.codigo).subscribe({
      next: (resposta) => {
        this.enviando = false;
        // A autorização vai junto na navegação (não fica salva no navegador)
        this.router.navigate(['/redefinir-senha'], { state: { token: resposta.token, email: this.emailVerificado } });
      },
      error: (erro) => {
        this.enviando = false;
        // Ex.: "Código incorreto. Restam 4 tentativas." / "O código expirou..."
        this.mostrar(this.montarMensagemErro(erro), true);
      },
    });
  }

  // Volta ao formulário para tentar outro e-mail
  trocarEmail(){
    this.emailVerificado = "";
    this.codigo = "";
    this.limparAlerta();
  }

  voltar(){
    location.href="login";
  }

  // ---------- Alertas temporários (4 s) ----------
  private mostrar(mensagem: string, erro: boolean) {
    this.limparAlerta();
    this.cdr.detectChanges();
    this.mensagem = mensagem;
    this.erro = erro;
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
    return "Não foi possível concluir a operação.";
  }
}
