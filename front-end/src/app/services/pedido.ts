import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { Pedido, PedidoRequest } from '../models/pedido';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly apiUrl = '/api/pedido';
  private readonly tempoLimite = 10000;

  constructor(private http: HttpClient) {}

  criar(pedido: PedidoRequest): Observable<Pedido> {
    return this.http
      .post<Pedido>(this.apiUrl, pedido)
      .pipe(timeout(this.tempoLimite));
  }
}
