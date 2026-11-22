const fs = require('fs');
const path = require('path');

// Procura o .env na pasta do Angular e nas 2 pastas acima dela
function acharEnv(pastaInicial) {
  let atual = pastaInicial;
  for (let i = 0; i < 3; i++) {
    const candidato = path.join(atual, '.env');
    if (fs.existsSync(candidato)) return candidato;
    const pai = path.dirname(atual);
    if (pai === atual) break;
    atual = pai;
  }
  return null;
}

// Lê as linhas CHAVE=valor do .env
function lerEnv(caminho) {
  const vars = {};
  fs.readFileSync(caminho, 'utf8').split(/\r?\n/).forEach((linha) => {
    const l = linha.trim();
    if (!l || l.startsWith('#') || !l.includes('=')) return;
    const i = l.indexOf('=');
    const valor = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    vars[l.slice(0, i).trim()] = valor;
  });
  return vars;
}

let env = {};
const caminhoEnv = acharEnv(__dirname);

if (caminhoEnv) {
  env = lerEnv(caminhoEnv);
  console.log(`[proxy] .env lido de: ${caminhoEnv}`);
} else {
  console.warn('[proxy] .env não encontrado; usando localhost:8081');
}

const host = env.BACKEND_HOST || 'localhost';
const porta = env.SERVER_PORT || '8081';
console.log(`[proxy] /api -> http://${host}:${porta}`);

// O back-end já expõe os endpoints com o prefixo /api (ex.: /api/produto/vitrine),
// por isso o caminho é repassado como está, sem pathRewrite.
module.exports = {
  '/api': {
    target: `http://${host}:${porta}`,
    secure: false,
    changeOrigin: true,
  },
};
