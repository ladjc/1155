import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  email:string = "";
  senha:string = "";
  mensagem:string = "";
  verificado:boolean = false;

  fazerLogin(){
      if(this.email=="luigi@gmail.com" && this.senha=="12345"){
        this.mensagem = "Seja bem vindo !"; 
        this.verificado = true; 
      } else if(this.email==""){
        this.mensagem = "Email não informado";
        this.verificado = false;
      }else if(this.senha==""){
        this.mensagem = "Senha não informada";
        this.verificado = false;
      } else{
        this.mensagem = "Email ou senha inválido";
        this.verificado = false;
      }
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
