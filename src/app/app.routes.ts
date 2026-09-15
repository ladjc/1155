import { Routes } from '@angular/router';
import { Cadastro } from './cadastro/cadastro';
import { Cesta } from './cesta/cesta';
import { Busca } from './busca/busca';
import { Vitrine } from './vitrine/vitrine';
import { Detalhe } from './detalhe/detalhe';
import { Login } from './login/login';
import { RecSenha } from './rec-senha/rec-senha';

export const routes: Routes = [
    {path:"cadastro", component:Cadastro},
    {path:"cesta", component:Cesta},
    {path:"busca", component:Busca},
    {path:"vitrine", component:Vitrine},
    {path:"detalhes", component:Detalhe},
    {path:"login", component:Login},
    {path:"rec-senha", component:RecSenha}
];
