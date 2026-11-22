import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeoutError } from 'rxjs';
import { Cliente, ClienteLogado } from '../models/cliente';
import { AuthService } from '../services/auth';
import { PADRAO_SENHA, requisitosFaltandoSenha } from '../utils/regras-senha';
import { campoInvalido, campoValido } from '../utils/validacao-campo';

/**
 * Tela usada de dois jeitos:
 *  - /cadastro         -> cadastra um cliente novo (POST)
 *  - /cadastro/editar  -> altera os dados do cliente logado (PUT), sem a senha
 *                         (a senha é trocada na tela "Alterar senha")
 */
@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-cadastro',
  styleUrl: './cadastro.css',
  templateUrl: './cadastro.html',
})
export class Cadastro implements OnInit, OnDestroy {
  @ViewChild('formCadastro') form?: NgForm;

  obj: Cliente = new Cliente();
  senhaAtual: string = "";       // edição: só pedida se mudar e-mail ou documento
  mensagem: string = "";
  erro: boolean = false;
  enviando: boolean = false;
  mostrarSenha: boolean = false;
  mostrarSenhaAtual: boolean = false;
  senhaEmFoco: boolean = false;
  edicao: boolean = false;

  private clienteOriginal: ClienteLogado | null = null;

  // Tempo que os alertas ficam na tela
  private readonly tempoAlerta = 4000;
  private timerAlerta?: ReturnType<typeof setTimeout>;

  // Mesmas regras do back-end (ClienteService)
  readonly padraoSenha = PADRAO_SENHA;
  readonly regraEmail = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.edicao = this.route.snapshot.data['edicao'] === true;
    if (!this.edicao) {
      return;
    }

    const cliente = this.auth.clienteLogado();
    if (!cliente) {
      this.router.navigate(['/login']);
      return;
    }
    // Preenche o formulário com os dados atuais (a senha não aparece aqui)
    this.clienteOriginal = cliente;
    this.obj.nome = cliente.nome;
    this.obj.email = cliente.email;
    this.obj.documento = cliente.documento;
    this.obj.endereco = cliente.endereco;
    this.obj.telefone = cliente.telefone ?? "";
    this.obj.senha = "";
  }

  // ---------- Alertas vermelhos dos campos ----------
  // Só depois que a pessoa digita no campo e ele fica vazio ou fora da regra
  // (regra completa em utils/validacao-campo.ts)
  campoInvalido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoInvalido(campo, elemento);
  }

  campoValido(campo: NgModel, elemento?: HTMLElement): boolean {
    return campoValido(campo, elemento);
  }

  // Requisitos que ainda faltam na senha do cadastro (lista adaptativa)
  get requisitosFaltando(): string[] {
    return requisitosFaltandoSenha(this.obj.senha);
  }

  /**
   * Na edição, a senha atual só é pedida quando o e-mail ou o documento mudam
   * (são os dados que identificam a conta). Nome, telefone e endereço mudam sem senha.
   */
  get precisaSenhaAtual(): boolean {
    const c = this.clienteOriginal;
    if (!this.edicao || !c) {
      return false;
    }
    return this.texto(this.obj.email).toLowerCase() !== c.email || this.texto(this.obj.documento) !== c.documento;
  }

  // ---------- Envio ----------
  gravar(){
    if (this.enviando) {
      return;
    }
    const o = this.obj;
    if (!this.texto(o.nome) || !this.texto(o.email) || !this.texto(o.documento) || !this.texto(o.endereco)
        || (!this.edicao && !o.senha)) {
      this.mostrar("Preencha todos os campos obrigatórios (*).", true);
      return;
    }
    if (this.edicao && !this.houveAlteracao()) {
      this.mostrar("Nenhuma alteração para salvar.", true);
      return;
    }
    if (!this.edicao && this.requisitosFaltando.length > 0) {
      this.mostrar("A senha não atende a todos os requisitos.", true);
      return;
    }
    if (this.precisaSenhaAtual && !this.senhaAtual) {
      this.mostrar("Para alterar o e-mail ou o documento, informe a sua senha atual.", true);
      return;
    }
    if (this.form?.invalid) {
      this.mostrar("Corrija os campos destacados em vermelho.", true);
      return;
    }

    if (this.edicao) {
      this.atualizar();
    } else {
      this.cadastrar();
    }
  }

  // POST /api/cliente: grava o cliente no banco e leva para o login
  private cadastrar() {
    this.enviando = true;
    this.limparAlerta();

    this.auth.cadastrar(this.obj).subscribe({
      next: () => {
        this.enviando = false;
        // Cadastro feito: vai para a tela de login, que mostra o aviso de sucesso
        this.router.navigate(['/login'], {
          state: { mensagem: "Cadastro feito com sucesso! Faça seu login." },
        });
      },
      error: (erro) => {
        this.enviando = false;
        // Ex.: 409 "E-mail já cadastrado." / "Documento já cadastrado."
        this.mostrar(this.montarMensagemErro(erro), true);
      },
    });
  }

  // PUT /api/cliente/{id}: o back-end aplica as mesmas regras do cadastro e confere
  // a senha atual quando o e-mail ou o documento mudam
  private atualizar() {
    const id = this.clienteOriginal?.id;
    if (!id) {
      return;
    }
    this.enviando = true;
    this.limparAlerta();

    this.auth.atualizar(id, {
      nome: this.obj.nome.trim(),
      email: this.obj.email.trim(),
      telefone: this.texto(this.obj.telefone) || null,
      documento: this.obj.documento.trim(),
      endereco: this.obj.endereco.trim(),
      senhaAtual: this.precisaSenhaAtual ? this.senhaAtual : null,
    }).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/conta'], { state: { mensagem: "Cadastro atualizado com sucesso!" } });
      },
      error: (erro) => {
        this.enviando = false;
        // Ex.: 401 "Senha atual incorreta." / 409 "E-mail já cadastrado."
        this.mostrar(this.montarMensagemErro(erro), true);
      },
    });
  }

  private houveAlteracao(): boolean {
    const c = this.clienteOriginal;
    if (!c) {
      return true;
    }
    return this.texto(this.obj.nome) !== c.nome
      || this.texto(this.obj.email).toLowerCase() !== c.email
      || this.texto(this.obj.documento) !== c.documento
      || this.texto(this.obj.endereco) !== c.endereco
      || this.texto(this.obj.telefone) !== (c.telefone ?? "");
  }

  private texto(valor: string | null | undefined): string {
    return (valor ?? "").trim();
  }

  // ---------- Alertas temporários (4 s) ----------
  private mostrar(mensagem: string, erro: boolean) {
    // Remove o alerta anterior antes de mostrar o novo, para a contagem (e a
    // animação) recomeçar mesmo que a mensagem seja igual
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
        return erro.error.mensagem; // 400, 401 ou 409 vindos do back-end
      }
    }
    return this.edicao ? "Não foi possível atualizar o cadastro." : "Não foi possível concluir o cadastro.";
  }

  voltar(){
    if (this.edicao) {
      this.router.navigate(['/conta']);
    } else {
      location.href="login";
    }
  }

}
