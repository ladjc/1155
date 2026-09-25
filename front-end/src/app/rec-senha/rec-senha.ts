import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule,FormsModule],
  selector: 'app-rec-senha',
  styleUrl: './rec-senha.css',
  templateUrl: './rec-senha.html',
})
export class RecSenha {
  mensagem: string = "";
  email: string = "";

  recuperar(){
    this.mensagem = "E-mail de recuperação enviado.";
  }
  voltar(){
    location.href="login";
  }
}
