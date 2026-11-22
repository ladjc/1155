# 1155 Store

## Programação WEB - Fatec Ipiranga

Projeto P1

Alunos: 
- Luigi Buono
- Luiz Cruz

## Recuperação de senha por e-mail (Mailtrap)

O "Esqueci a senha" envia um código de 6 dígitos por e-mail. Para testes usamos o
[Mailtrap](https://mailtrap.io) (Email Testing / Sandbox): o e-mail é enviado de verdade,
mas fica preso numa caixa de entrada de testes no site, sem chegar a ninguém.

1. Crie uma conta gratuita no Mailtrap e abra **Email Testing > Inboxes > (sua caixa)**.
2. Em **Integration > SMTP**, copie o host, a porta, o usuário e a senha.
3. No arquivo `.env` da raiz do projeto, preencha:

   ```properties
   EMAIL_MODO=smtp
   MAIL_HOST=sandbox.smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=<usuário copiado do Mailtrap>
   MAIL_PASSWORD=<senha copiada do Mailtrap>
   ```

4. Reinicie o back-end. Os e-mails com o código aparecem na caixa do Mailtrap.

Com `EMAIL_MODO=log` (padrão), nenhum e-mail é enviado: o código aparece no console do back-end.

> O `.env` tem senhas e **não** deve ir para o Git (já está no `.gitignore`).
> Para enviar e-mails reais a clientes, basta trocar os dados SMTP no `.env`
> (ex.: Gmail com senha de app, SendGrid, Brevo), sem alterar o código.

