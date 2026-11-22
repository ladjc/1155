import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout } from 'rxjs';
import { AlteracaoSenha, Cliente, ClienteAtualizacao, ClienteLogado, LoginRequest } from '../models/cliente';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/cliente';
  private readonly tempoLimite = 10000;
  private readonly chaveStorage = 'clienteLogado';

  private readonly http = inject(HttpClient);
  private readonly noNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  // Signal: qualquer componente (nav, cesta, login) é atualizado sozinho quando muda
  readonly clienteLogado = signal<ClienteLogado | null>(this.lerSessao());
  readonly estaLogado = computed(() => this.clienteLogado() !== null);

  /**
   * Envia e-mail e senha para o back-end. Só dá certo (HTTP 200) se o e-mail
   * existir na tabela cliente e a senha conferir; caso contrário vem 401.
   * "lembrar" = true guarda no localStorage (continua logado ao fechar o navegador);
   * false guarda no sessionStorage (sai ao fechar a aba).
   */
  login(email: string, senha: string, lembrar: boolean): Observable<ClienteLogado> {
    const corpo: LoginRequest = { email: email.trim(), senha };
    return this.http.post<ClienteLogado>(`${this.apiUrl}/login`, corpo).pipe(
      timeout(this.tempoLimite),
      tap((cliente) => this.salvarSessao(cliente, lembrar)),
    );
  }

  cadastrar(cliente: Cliente): Observable<ClienteLogado> {
    return this.http.post<ClienteLogado>(this.apiUrl, cliente).pipe(timeout(this.tempoLimite));
  }

  // PUT /api/cliente/{id}: se der certo, o nome/e-mail novos já aparecem no site
  atualizar(id: number, dados: ClienteAtualizacao): Observable<ClienteLogado> {
    return this.http.put<ClienteLogado>(`${this.apiUrl}/${id}`, dados).pipe(
      timeout(this.tempoLimite),
      tap((cliente) => this.atualizarSessao(cliente)),
    );
  }

  // PUT /api/cliente/{id}/senha: troca só a senha (o back-end confere a senha atual)
  alterarSenha(id: number, dados: AlteracaoSenha): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/senha`, dados).pipe(timeout(this.tempoLimite));
  }

  // ---------- Recuperar senha ("Esqueci a senha") ----------
  private readonly apiRecuperacao = `${this.apiUrl}/recuperar-senha`;

  // 1ª etapa: confere se o e-mail está cadastrado (404 se não) e envia o código de 6 dígitos
  verificarEmailRecuperacao(email: string): Observable<{ mensagem: string; email: string }> {
    return this.http
      .post<{ mensagem: string; email: string }>(`${this.apiRecuperacao}/verificar`, { email: email.trim() })
      .pipe(timeout(this.tempoLimite));
  }

  // 2ª etapa: confere o código; se estiver certo, devolve a autorização (token) para trocar a senha
  confirmarCodigoRecuperacao(email: string, codigo: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiRecuperacao}/confirmar`, { email, codigo })
      .pipe(timeout(this.tempoLimite));
  }

  // 3ª etapa: grava a nova senha usando a autorização recebida na 2ª etapa
  redefinirSenhaRecuperacao(token: string, novaSenha: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiRecuperacao}/redefinir`, { token, novaSenha })
      .pipe(timeout(this.tempoLimite));
  }

  logout(): void {
    if (this.noNavegador) {
      localStorage.removeItem(this.chaveStorage);
      sessionStorage.removeItem(this.chaveStorage);
    }
    this.clienteLogado.set(null);
  }

  private salvarSessao(cliente: ClienteLogado, lembrar: boolean): void {
    if (this.noNavegador) {
      localStorage.removeItem(this.chaveStorage);
      sessionStorage.removeItem(this.chaveStorage);
      (lembrar ? localStorage : sessionStorage).setItem(this.chaveStorage, JSON.stringify(cliente));
    }
    this.clienteLogado.set(cliente);
  }

  // Mantém a sessão onde já estava (localStorage = "Manter conectado")
  private atualizarSessao(cliente: ClienteLogado): void {
    const lembrar = this.noNavegador && localStorage.getItem(this.chaveStorage) !== null;
    this.salvarSessao(cliente, lembrar);
  }

  private lerSessao(): ClienteLogado | null {
    if (!this.noNavegador) {
      return null;
    }
    const json = localStorage.getItem(this.chaveStorage) ?? sessionStorage.getItem(this.chaveStorage);
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json) as ClienteLogado;
    } catch {
      return null;
    }
  }
}
