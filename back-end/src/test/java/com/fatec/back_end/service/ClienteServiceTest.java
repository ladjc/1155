package com.fatec.back_end.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fatec.back_end.dto.AlteracaoSenhaRequest;
import com.fatec.back_end.dto.ClienteAtualizacaoRequest;
import com.fatec.back_end.dto.ClienteResponse;
import com.fatec.back_end.dto.LoginRequest;
import com.fatec.back_end.dto.VerificacaoEmailRequest;
import com.fatec.back_end.exception.ClienteJaCadastradoException;
import com.fatec.back_end.exception.ClienteNaoEncontradoException;
import com.fatec.back_end.exception.CredenciaisInvalidasException;
import com.fatec.back_end.model.Cliente;
import com.fatec.back_end.repository.ClienteRepository;

class ClienteServiceTest {

    private ClienteRepository repository;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private ClienteService service;

    @BeforeEach
    void setUp() {
        repository = mock(ClienteRepository.class);
        service = new ClienteService(repository, encoder);
    }

    private Cliente clienteValido() {
        Cliente c = new Cliente();
        c.setNome("Luigi");
        c.setEmail("Luigi@Gmail.com");
        c.setDocumento("123");
        c.setEndereco("Rua A");
        c.setSenha("Senha@123");
        return c;
    }

    @Test
    void cadastrarGravaHashENormalizaEmail() {
        when(repository.saveAndFlush(any())).thenAnswer(inv -> {
            Cliente c = inv.getArgument(0);
            c.setId(1);
            return c;
        });
        Cliente cliente = clienteValido();
        ClienteResponse resposta = service.cadastrar(cliente);

        assertEquals("luigi@gmail.com", resposta.email());
        assertNotEquals("Senha@123", cliente.getSenha());
        assertEquals(true, encoder.matches("Senha@123", cliente.getSenha()));
    }

    @Test
    void cadastrarRecusaEmailRepetido() {
        when(repository.existsByEmailIgnoreCase("luigi@gmail.com")).thenReturn(true);
        ClienteJaCadastradoException e = assertThrows(ClienteJaCadastradoException.class,
                () -> service.cadastrar(clienteValido()));
        assertEquals("E-mail já cadastrado.", e.getMessage());
    }

    @Test
    void cadastrarRecusaDocumentoRepetido() {
        when(repository.existsByDocumento("123")).thenReturn(true);
        ClienteJaCadastradoException e = assertThrows(ClienteJaCadastradoException.class,
                () -> service.cadastrar(clienteValido()));
        assertEquals("Documento já cadastrado.", e.getMessage());
    }

    @Test
    void cadastrarRecusaEmailEDocumentoRepetidos() {
        when(repository.existsByEmailIgnoreCase("luigi@gmail.com")).thenReturn(true);
        when(repository.existsByDocumento("123")).thenReturn(true);
        ClienteJaCadastradoException e = assertThrows(ClienteJaCadastradoException.class,
                () -> service.cadastrar(clienteValido()));
        assertEquals("E-mail e documento já cadastrados.", e.getMessage());
    }

    @Test
    void cadastrarRecusaSenhaFraca() {
        Cliente c = clienteValido();
        c.setSenha("12345");
        assertThrows(IllegalArgumentException.class, () -> service.cadastrar(c));
    }

    @Test
    void loginComEmailESenhaCorretos() {
        Cliente c = clienteValido();
        c.setId(7);
        c.setSenha(encoder.encode("Senha@123"));
        when(repository.findByEmailIgnoreCase("luigi@gmail.com")).thenReturn(Optional.of(c));

        assertEquals(7, service.autenticar(new LoginRequest(" luigi@gmail.com ", "Senha@123")).id());
    }

    @Test
    void loginComSenhaErrada() {
        Cliente c = clienteValido();
        c.setSenha(encoder.encode("Senha@123"));
        when(repository.findByEmailIgnoreCase("luigi@gmail.com")).thenReturn(Optional.of(c));

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginRequest("luigi@gmail.com", "Errada@123")));
    }

    @Test
    void loginComEmailInexistente() {
        when(repository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginRequest("nao@existe.com", "Senha@123")));
    }

    // ---------- Alterar cadastro (PUT /cliente/{id}) ----------

    private Cliente clienteSalvo() {
        Cliente c = clienteValido();
        c.setId(7);
        c.setEmail("luigi@gmail.com");
        c.setSenha(encoder.encode("Senha@123"));
        when(repository.findById(7)).thenReturn(Optional.of(c));
        when(repository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        return c;
    }

    private ClienteAtualizacaoRequest pedido(String email, String documento, String senhaAtual) {
        return new ClienteAtualizacaoRequest("Luigi B", email, "91234-5678", documento, "Rua B", senhaAtual);
    }

    @Test
    void atualizarNomeTelefoneEnderecoSemSenhaAtual() {
        Cliente c = clienteSalvo();
        String hash = c.getSenha();

        ClienteResponse r = service.atualizar(7, pedido("luigi@gmail.com", "123", null));

        assertEquals("Luigi B", r.nome());
        assertEquals("91234-5678", r.telefone());
        assertEquals("Rua B", r.endereco());
        assertEquals(hash, c.getSenha()); // a senha não muda aqui
    }

    @Test
    void mesmoEmailComMaiusculasNaoContaComoAlteracao() {
        clienteSalvo();
        ClienteResponse r = service.atualizar(7, pedido("LUIGI@gmail.com", " 123 ", null));
        assertEquals("luigi@gmail.com", r.email());
    }

    @Test
    void alterarEmailExigeSenhaAtual() {
        clienteSalvo();
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.atualizar(7, pedido("novo@gmail.com", "123", null)));
        assertEquals("Para alterar o e-mail ou o documento, informe a sua senha atual.", e.getMessage());

        assertEquals("novo@gmail.com", service.atualizar(7, pedido("novo@gmail.com", "123", "Senha@123")).email());
    }

    @Test
    void alterarDocumentoExigeSenhaAtualCorreta() {
        clienteSalvo();
        CredenciaisInvalidasException e = assertThrows(CredenciaisInvalidasException.class,
                () -> service.atualizar(7, pedido("luigi@gmail.com", "999", "Errada@1")));
        assertEquals("Senha atual incorreta.", e.getMessage());
    }

    @Test
    void atualizarRecusaEmailDeOutroCliente() {
        clienteSalvo();
        when(repository.existsByEmailIgnoreCaseAndIdNot("maria@x.com", 7)).thenReturn(true);
        ClienteJaCadastradoException e = assertThrows(ClienteJaCadastradoException.class,
                () -> service.atualizar(7, pedido("maria@x.com", "123", "Senha@123")));
        assertEquals("E-mail já cadastrado.", e.getMessage());
    }

    @Test
    void atualizarRecusaDocumentoDeOutroCliente() {
        clienteSalvo();
        when(repository.existsByDocumentoAndIdNot("555", 7)).thenReturn(true);
        ClienteJaCadastradoException e = assertThrows(ClienteJaCadastradoException.class,
                () -> service.atualizar(7, pedido("luigi@gmail.com", "555", "Senha@123")));
        assertEquals("Documento já cadastrado.", e.getMessage());
    }

    @Test
    void atualizarAplicaAsMesmasRegrasDoCadastro() {
        clienteSalvo();
        assertThrows(IllegalArgumentException.class, () -> service.atualizar(7, pedido("email-invalido", "123", "Senha@123")));
        assertThrows(IllegalArgumentException.class, () -> service.atualizar(7, pedido("luigi@gmail.com", " ", null)));
        assertThrows(IllegalArgumentException.class, () -> service.atualizar(7,
                new ClienteAtualizacaoRequest("Luigi", "luigi@gmail.com", "1234", "123", "Rua", null)));
    }

    @Test
    void atualizarClienteInexistente() {
        when(repository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ClienteNaoEncontradoException.class, () -> service.atualizar(99, pedido("a@b.com", "1", null)));
    }

    // ---------- Alterar senha (PUT /cliente/{id}/senha) ----------

    @Test
    void alterarSenhaTrocaOHash() {
        Cliente c = clienteSalvo();
        service.alterarSenha(7, new AlteracaoSenhaRequest("Senha@123", "Nova@4567"));
        assertEquals(true, encoder.matches("Nova@4567", c.getSenha()));
    }

    @Test
    void alterarSenhaExigeSenhaAtualCorreta() {
        clienteSalvo();
        CredenciaisInvalidasException e = assertThrows(CredenciaisInvalidasException.class,
                () -> service.alterarSenha(7, new AlteracaoSenhaRequest("Errada@1", "Nova@4567")));
        assertEquals("Senha atual incorreta.", e.getMessage());
    }

    @Test
    void alterarSenhaAplicaRegraEExigeSenhaDiferente() {
        clienteSalvo();
        assertThrows(IllegalArgumentException.class, () -> service.alterarSenha(7, new AlteracaoSenhaRequest("Senha@123", "fraca")));
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.alterarSenha(7, new AlteracaoSenhaRequest("Senha@123", "Senha@123")));
        assertEquals("A nova senha deve ser diferente da senha atual.", e.getMessage());
        assertThrows(IllegalArgumentException.class, () -> service.alterarSenha(7, new AlteracaoSenhaRequest("", "Nova@4567")));
    }

    // ---------- Recuperar senha: verificação do e-mail ----------

    @Test
    void verificarEmailCadastrado() {
        when(repository.existsByEmailIgnoreCase("luigi@gmail.com")).thenReturn(true);
        assertEquals("luigi@gmail.com", service.verificarEmailParaRecuperacao(new VerificacaoEmailRequest("  Luigi@Gmail.com ")));
    }

    @Test
    void verificarEmailNaoCadastrado() {
        ClienteNaoEncontradoException e = assertThrows(ClienteNaoEncontradoException.class,
                () -> service.verificarEmailParaRecuperacao(new VerificacaoEmailRequest("ninguem@x.com")));
        assertEquals("Não existe cadastro com este e-mail.", e.getMessage());
    }

    @Test
    void verificarEmailVazioOuInvalido() {
        IllegalArgumentException vazio = assertThrows(IllegalArgumentException.class,
                () -> service.verificarEmailParaRecuperacao(new VerificacaoEmailRequest(" ")));
        assertEquals("Informe o seu e-mail.", vazio.getMessage());
        IllegalArgumentException invalido = assertThrows(IllegalArgumentException.class,
                () -> service.verificarEmailParaRecuperacao(new VerificacaoEmailRequest("maria@")));
        assertEquals("Informe um e-mail válido.", invalido.getMessage());
    }

    // ---------- Recuperar senha: gravação da nova senha ----------

    @Test
    void redefinirSenhaAplicaARegraDoCadastro() {
        Cliente c = clienteSalvo();
        assertThrows(IllegalArgumentException.class, () -> service.redefinirSenha(7, "fraca"));
        assertThrows(IllegalArgumentException.class, () -> service.redefinirSenha(7, ""));

        service.redefinirSenha(7, "Nova@4567");
        assertEquals(true, encoder.matches("Nova@4567", c.getSenha()));
    }
}
