// Dados enviados no cadastro (POST /api/cliente)
export class Cliente {
    nome:string="";
    email:string="";
    telefone:string="";
    documento:string="";
    endereco:string="";
    senha:string="";
}

// Corpo do login (POST /api/cliente/login)
export interface LoginRequest {
    email: string;
    senha: string;
}

// O que o back-end devolve após cadastro/login (nunca contém a senha)
export interface ClienteLogado {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    documento: string;
    endereco: string;
}

// Corpo de "alterar cadastro" (PUT /api/cliente/{id})
export interface ClienteAtualizacao {
    nome: string;
    email: string;
    telefone: string | null;
    documento: string;
    endereco: string;
    senhaAtual: string | null; // só é exigida se o e-mail ou o documento mudarem
}

// Corpo de "alterar senha" (PUT /api/cliente/{id}/senha)
export interface AlteracaoSenha {
    senhaAtual: string;
    novaSenha: string;
}
