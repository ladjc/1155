// Regras de senha usadas no cadastro e na troca de senha.
// São as mesmas do back-end (ClienteService.REGRA_SENHA).

export const TAMANHO_MINIMO_SENHA = 8;
export const ESPECIAIS_SENHA = "@$!%*?&";
export const PADRAO_SENHA = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}";

/**
 * Lista só o que ainda falta na senha digitada. Como é recalculada a cada
 * tecla, um requisito some quando é atendido e volta se for apagado.
 */
export function requisitosFaltandoSenha(senha: string | null | undefined): string[] {
  const valor = senha ?? "";
  const faltando: string[] = [];

  if (valor.length < TAMANHO_MINIMO_SENHA) {
    const resta = TAMANHO_MINIMO_SENHA - valor.length;
    faltando.push(`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres (${resta === 1 ? "falta 1" : `faltam ${resta}`})`);
  }
  if (!/[A-Z]/.test(valor)) {
    faltando.push("Uma letra maiúscula");
  }
  if (!/[a-z]/.test(valor)) {
    faltando.push("Uma letra minúscula");
  }
  if (!/\d/.test(valor)) {
    faltando.push("Um número");
  }
  if (!/[@$!%*?&]/.test(valor)) {
    faltando.push(`Um caractere especial (${ESPECIAIS_SENHA})`);
  }
  // Só aparece se o usuário digitar algo fora do permitido (espaço, acento, #...)
  const invalidos = [...new Set(valor.replace(/[A-Za-z\d@$!%*?&]/g, ""))];
  if (invalidos.length > 0) {
    const lista = invalidos.map((c) => (c === " " ? "espaço" : c)).join(" ");
    faltando.push(`Remover caracteres não permitidos: ${lista}`);
  }
  return faltando;
}
