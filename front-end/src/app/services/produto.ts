import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { Produto } from '../models/produto';

export interface FiltroBusca {
  termo?: string;
  categoria?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProdutoService {
  // O proxy (proxy.conf.js) encaminha /api para o back-end na SERVER_PORT do .env
  private readonly apiUrl = '/api/produto';

  // Tempo máximo de espera pela resposta do back-end (ms)
  private readonly tempoLimite = 10000;

  constructor(private http: HttpClient) { }

  // GET /api/produto/vitrine
  getVitrine(): Observable<Produto[]> {
    return this.http
      .get<Produto[]>(`${this.apiUrl}/vitrine`)
      .pipe(timeout(this.tempoLimite));
  }

  // GET /api/produto/busca?termo=...&categoria=...
  // Se o back-end usar outros nomes de parâmetro, é só ajustar aqui.
  buscar(filtro: FiltroBusca): Observable<Produto[]> {
    let params = new HttpParams();
    if (filtro.termo) {
      params = params.set('termo', filtro.termo);
    }
    if (filtro.categoria) {
      params = params.set('categoria', filtro.categoria);
    }

    return this.http
      .get<Produto[]>(`${this.apiUrl}/busca`, { params })
      .pipe(timeout(this.tempoLimite));
  }

  // GET /api/produto/{id}
  getProdutoPorId(id: number): Observable<Produto> {
    return this.http
      .get<Produto>(`${this.apiUrl}/${id}`)
      .pipe(timeout(this.tempoLimite));
  }
}
