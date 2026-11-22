import { NgModel } from '@angular/forms';

/**
 * Regra dos alertas vermelhos dos campos (login, cadastro e troca de senha):
 * clicar no campo, ou só passar por ele, não deixa nada vermelho. O alerta só
 * aparece depois que a pessoa INTERAGE (digita) e o campo fica fora da regra:
 *  - se ela apagar tudo de um campo obrigatório, fica vermelho na hora;
 *  - erros de formato (e-mail, telefone, senha) só aparecem com o cursor fora
 *    do campo, para não ficar vermelho enquanto a pessoa ainda está digitando.
 *    Para isso, passe o próprio <input> como segundo parâmetro.
 */
export function campoInvalido(campo: NgModel, elemento?: HTMLElement): boolean {
  if (!campo.invalid || !campo.dirty) {
    return false;
  }
  if (campo.errors?.['required']) {
    return true;
  }
  return !!campo.touched && !emFoco(elemento);
}

// Verde: só depois de digitar algo válido e sair do campo
export function campoValido(campo: NgModel, elemento?: HTMLElement): boolean {
  return !!campo.valid && !!campo.dirty && !!campo.touched && !!campo.value && !emFoco(elemento);
}

function emFoco(elemento?: HTMLElement): boolean {
  return !!elemento && typeof document !== 'undefined' && document.activeElement === elemento;
}
