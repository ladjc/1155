import { Routes } from '@angular/router';
import { Cadastro } from './cadastro/cadastro';
import { Cesta } from './cesta/cesta';
import { Busca } from './busca/busca';
import { Vitrine } from './vitrine/vitrine';
import { Detalhe } from './detalhe/detalhe';
import { Login } from './login/login';
import { RecSenha } from './rec-senha/rec-senha';
import { RedefinirSenha } from './redefinir-senha/redefinir-senha';
import { Conta } from './conta/conta';
import { AlterarSenha } from './alterar-senha/alterar-senha';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {path:"cadastro", component:Cadastro},
    // Mesma tela de cadastro, em modo de alteração (PUT) dos dados do cliente logado
    {path:"cadastro/editar", component:Cadastro, canActivate:[authGuard], data:{edicao:true}},
    {path:"conta", component:Conta, canActivate:[authGuard]},
    {path:"conta/senha", component:AlterarSenha, canActivate:[authGuard]},
    {path:"cesta", component:Cesta},
    {path:"busca", component:Busca},
    {path:"", component:Vitrine},
    {path:"detalhes", component:Detalhe},
    {path:"login", component:Login},
    {path:"rec-senha", component:RecSenha},
    // Última etapa do "Esqueci a senha" (só funciona vindo da confirmação do código)
    {path:"redefinir-senha", component:RedefinirSenha}
];
