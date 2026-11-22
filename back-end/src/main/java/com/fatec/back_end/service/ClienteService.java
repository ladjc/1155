package com.fatec.back_end.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
public class ClienteService {

    // Mesmas regras do formulário de cadastro do front-end
    private static final String REGRA_SENHA = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}";
    private static final String REGRA_EMAIL = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
    private static final String REGRA_TELEFONE = "[0-9]{4,5}-[0-9]{4}";

    private static final String MSG_SENHA = "A senha deve ter pelo menos 8 caracteres, com letra maiúscula, "
            + "letra minúscula, número e caractere especial (@$!%*?&).";

    private final ClienteRepository repository;
    private final PasswordEncoder passwordEncoder;

    public ClienteService(ClienteRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ClienteResponse cadastrar(Cliente cliente) {
        if (cliente == null) {
            throw new IllegalArgumentException("Preencha todos os campos obrigatórios.");
        }
        validarDados(cliente.getNome(), cliente.getEmail(), cliente.getTelefone(), cliente.getDocumento(),
                cliente.getEndereco());
        if (cliente.getSenha() == null || !cliente.getSenha().matches(REGRA_SENHA)) {
            throw new IllegalArgumentException(MSG_SENHA);
        }

        String email = normalizarEmail(cliente.getEmail());
        String documento = cliente.getDocumento().trim();
        verificarDuplicados(repository.existsByEmailIgnoreCase(email), repository.existsByDocumento(documento));

        cliente.setId(null);
        cliente.setNome(cliente.getNome().trim());
        cliente.setEmail(email);
        cliente.setDocumento(documento);
        cliente.setEndereco(cliente.getEndereco().trim());
        cliente.setTelefone(textoOuNulo(cliente.getTelefone()));
        cliente.setSenha(passwordEncoder.encode(cliente.getSenha()));
        return salvar(cliente);
    }

    /**
     * Atualiza os dados de um cliente já cadastrado (sem mexer na senha). Aplica
     * as mesmas regras do cadastro e não deixa trocar o e-mail ou o documento por
     * um que já pertence a outro cliente. A senha atual só é exigida para alterar
     * o e-mail ou o documento, que identificam a conta.
     */
    @Transactional
    public ClienteResponse atualizar(Integer id, ClienteAtualizacaoRequest dados) {
        Cliente cliente = repository.findById(id).orElseThrow(ClienteNaoEncontradoException::new);

        if (dados == null) {
            throw new IllegalArgumentException("Preencha todos os campos obrigatórios.");
        }
        validarDados(dados.nome(), dados.email(), dados.telefone(), dados.documento(), dados.endereco());

        String email = normalizarEmail(dados.email());
        String documento = dados.documento().trim();
        boolean mudouEmailOuDocumento = !email.equals(cliente.getEmail()) || !documento.equals(cliente.getDocumento());
        if (mudouEmailOuDocumento) {
            if (vazio(dados.senhaAtual())) {
                throw new IllegalArgumentException("Para alterar o e-mail ou o documento, informe a sua senha atual.");
            }
            conferirSenhaAtual(cliente, dados.senhaAtual());
        }

        verificarDuplicados(repository.existsByEmailIgnoreCaseAndIdNot(email, id),
                repository.existsByDocumentoAndIdNot(documento, id));

        cliente.setNome(dados.nome().trim());
        cliente.setEmail(email);
        cliente.setDocumento(documento);
        cliente.setEndereco(dados.endereco().trim());
        cliente.setTelefone(textoOuNulo(dados.telefone()));
        return salvar(cliente);
    }

    /**
     * Troca somente a senha. Exige a senha atual e aplica a mesma regra de senha
     * do cadastro; a nova senha precisa ser diferente da atual.
     */
    @Transactional
    public void alterarSenha(Integer id, AlteracaoSenhaRequest dados) {
        Cliente cliente = repository.findById(id).orElseThrow(ClienteNaoEncontradoException::new);

        if (dados == null || vazio(dados.senhaAtual()) || vazio(dados.novaSenha())) {
            throw new IllegalArgumentException("Informe a senha atual e a nova senha.");
        }
        conferirSenhaAtual(cliente, dados.senhaAtual());
        if (!dados.novaSenha().matches(REGRA_SENHA)) {
            throw new IllegalArgumentException(MSG_SENHA);
        }
        if (passwordEncoder.matches(dados.novaSenha(), cliente.getSenha())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da senha atual.");
        }

        cliente.setSenha(passwordEncoder.encode(dados.novaSenha()));
        repository.save(cliente);
    }

    /**
     * Só autentica se o e-mail existir no banco E a senha conferir com o hash
     * gravado. A mensagem de erro é a mesma nos dois casos para não revelar
     * quais e-mails estão cadastrados.
     */
    public ClienteResponse autenticar(LoginRequest login) {
        if (login == null || vazio(login.email()) || vazio(login.senha())) {
            throw new IllegalArgumentException("Informe e-mail e senha.");
        }

        Cliente cliente = repository.findByEmailIgnoreCase(login.email().trim())
                .orElseThrow(CredenciaisInvalidasException::new);

        if (cliente.getSenha() == null || !passwordEncoder.matches(login.senha(), cliente.getSenha())) {
            throw new CredenciaisInvalidasException();
        }

        return ClienteResponse.de(cliente);
    }

    /**
     * Recuperação de senha - 1ª etapa: confere se o e-mail tem formato válido e se
     * pertence a algum cliente. Devolve o e-mail normalizado (minúsculo, sem espaços).
     */
    public String verificarEmailParaRecuperacao(VerificacaoEmailRequest dados) {
        if (dados == null || vazio(dados.email())) {
            throw new IllegalArgumentException("Informe o seu e-mail.");
        }
        String email = normalizarEmail(dados.email());
        if (!email.matches(REGRA_EMAIL)) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }
        if (!repository.existsByEmailIgnoreCase(email)) {
            throw new ClienteNaoEncontradoException("Não existe cadastro com este e-mail.");
        }
        return email;
    }

    /**
     * Recuperação de senha - última etapa: grava a nova senha (mesma regra do
     * cadastro). Quem chama já conferiu o código enviado ao cliente.
     */
    @Transactional
    public void redefinirSenha(Integer clienteId, String novaSenha) {
        Cliente cliente = repository.findById(clienteId).orElseThrow(ClienteNaoEncontradoException::new);
        if (vazio(novaSenha)) {
            throw new IllegalArgumentException("Informe a nova senha.");
        }
        if (!novaSenha.matches(REGRA_SENHA)) {
            throw new IllegalArgumentException(MSG_SENHA);
        }
        cliente.setSenha(passwordEncoder.encode(novaSenha));
        repository.save(cliente);
    }

    // ---------- Regras compartilhadas entre cadastro e atualização ----------

    private void validarDados(String nome, String email, String telefone, String documento, String endereco) {
        if (vazio(nome) || vazio(email) || vazio(documento) || vazio(endereco)) {
            throw new IllegalArgumentException("Preencha todos os campos obrigatórios.");
        }
        if (!email.trim().matches(REGRA_EMAIL)) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }
        if (!vazio(telefone) && !telefone.trim().matches(REGRA_TELEFONE)) {
            throw new IllegalArgumentException("O telefone deve estar no formato 0000-0000 ou 00000-0000.");
        }
    }

    private void conferirSenhaAtual(Cliente cliente, String senhaAtual) {
        if (cliente.getSenha() == null || !passwordEncoder.matches(senhaAtual, cliente.getSenha())) {
            throw new CredenciaisInvalidasException("Senha atual incorreta.");
        }
    }

    // Verifica os dois campos para avisar tudo o que está repetido de uma vez
    private void verificarDuplicados(boolean emailRepetido, boolean documentoRepetido) {
        if (emailRepetido && documentoRepetido) {
            throw new ClienteJaCadastradoException("E-mail e documento já cadastrados.");
        }
        if (emailRepetido) {
            throw new ClienteJaCadastradoException("E-mail já cadastrado.");
        }
        if (documentoRepetido) {
            throw new ClienteJaCadastradoException("Documento já cadastrado.");
        }
    }

    private ClienteResponse salvar(Cliente cliente) {
        try {
            // saveAndFlush força o comando no banco aqui: se dois pedidos com o mesmo
            // e-mail/documento chegarem ao mesmo tempo, a restrição UNIQUE barra o segundo
            return ClienteResponse.de(repository.saveAndFlush(cliente));
        } catch (DataIntegrityViolationException e) {
            throw new ClienteJaCadastradoException("E-mail ou documento já cadastrados.");
        }
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String textoOuNulo(String valor) {
        return vazio(valor) ? null : valor.trim();
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}
