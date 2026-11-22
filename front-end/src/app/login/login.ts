import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { AuthService } from '../services/auth';
import { campoInvalido, campoValido } from '../utils/validacao-campo';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit, OnDestroy {
  @ViewChild('formLogin') form?: NgForm;
  readonly regraEmail = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
  email:string = "";
  senha:string = "";
  lembrar:boolean = false;
  mensagem:string = "";       // mensagens de erro (alerta vermelho)
  boasVindas:boolean = false; // alerta verde logo após o login
  mensagemSucesso:string = ""; // alerta verde vindo de outra tela (ex.: senha redefinida)
  enviando:boolean = false;
  mostrarSenha:boolean = false;

  // Tempo que os alertas ficam na tela
  private readonly tempoAlerta = 4000;
  private timerAlerta?: ReturnType<typeof setTimeout>;

  constructor(public auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Ex.: "Senha redefinida com sucesso!" enviado pela tela de redefinir senha
    const mensagem = typeof history !== "undefined" ? history.state?.mensagem : undefined;
    if (typeof mensagem === "string" && mensagem) {
      this.mensagemSucesso = mensagem;
      this.agendarFimDoAlerta();
    }
  }

  // Vem do AuthService (signal): se o cliente sair pelo menu, esta tela volta
  // sozinha para o formulário de login
  get verificado(): boolean {
    return this.auth.estaLogado();
  }

  // Alerta vermelho do campo: clicar no campo não deixa nada vermelho; só depois
  // que a pessoa digita e ele fica vazio ou fora da regra (utils/validacao-campo.ts)
  campoInvalido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoInvalido(campo, elemento);
  }

  campoValido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoValido(campo, elemento);
  }

  fazerLogin(){
    if (this.enviando) {
      return;
    }
    if (this.email.trim() == "") {
      this.mostrarErro("Email não informado");
      return;
    }
    if (this.senha == "") {
      this.mostrarErro("Senha não informada");
      return;
    }
    if (this.form?.invalid) {
      this.mostrarErro("Informe um e-mail válido");
      return;
    }

    this.enviando = true;
    this.limparAlerta();

    // A validação de e-mail e senha agora é feita pelo back-end, na tabela cliente
    this.auth.login(this.email, this.senha, this.lembrar).subscribe({
      next: () => {
        this.enviando = false;
        this.senha = "";
        this.mostrarSenha = false;
        this.mensagem = "";
        this.boasVindas = true;
        this.cdr.detectChanges();
        this.agendarFimDoAlerta();
      },
      error: (erro) => {
        this.enviando = false;
        this.mostrarErro(this.montarMensagemErro(erro));
      },
    });
  }

  // ---------- Alertas temporários ----------
  private mostrarErro(texto: string) {
    // Remove o alerta anterior antes de mostrar o novo, para a contagem (e a
    // animação) recomeçar mesmo que a mensagem seja igual
    this.limparAlerta();
    this.cdr.detectChanges();
    this.mensagem = texto;
    this.cdr.detectChanges();
    this.agendarFimDoAlerta();
  }

  private agendarFimDoAlerta() {
    clearTimeout(this.timerAlerta);
    this.timerAlerta = setTimeout(() => {
      this.mensagem = "";
      this.boasVindas = false;
      this.mensagemSucesso = "";
      this.cdr.detectChanges();
    }, this.tempoAlerta);
  }

  private limparAlerta() {
    clearTimeout(this.timerAlerta);
    this.mensagem = "";
    this.boasVindas = false;
    this.mensagemSucesso = "";
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
        return erro.error.mensagem; // 400 ou 401 vindos do back-end
      }
    }
    return "Email ou senha inválido";
  }

  esqueciSenha(){
    location.href="rec-senha";
  }
  voltar(){
    location.href="";
  }
  carrinho(){
    location.href="cesta";
  }

}
