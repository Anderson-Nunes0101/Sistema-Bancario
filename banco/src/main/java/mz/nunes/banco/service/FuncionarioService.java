package mz.nunes.banco.service;

import mz.nunes.banco.dto.Dtos.FuncionarioRequest;
import mz.nunes.banco.exception.ConflitoException;
import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import mz.nunes.banco.model.EstadoUsuario;
import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.model.Funcionario;
import mz.nunes.banco.model.TipoUsuario;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.repository.FuncionarioRepository;
import mz.nunes.banco.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder encoder;

    public FuncionarioService(FuncionarioRepository funcionarioRepository,
                              UsuarioRepository usuarioRepository, PasswordEncoder encoder) {
        this.funcionarioRepository = funcionarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<Funcionario> listarFuncionarios() {
        return funcionarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Funcionario buscar(Long id) {
        return funcionarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionário não encontrado com o ID: " + id));
    }

    /** Cadastro: cria o funcionário e o utilizador de login (senha guardada com BCrypt). */
    @Transactional
    public Funcionario criar(FuncionarioRequest dados, Set<Permissao> permissoes) {
        String email = dados.email().trim();
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflitoException("Já existe um utilizador com este email.");
        }

        Funcionario f = funcionarioRepository.save(new Funcionario(dados.nome().trim(), email, "ATIVO"));

        Usuario u = new Usuario();
        u.setNome(f.getNome());
        u.setEmail(email);
        u.setSenha(encoder.encode(dados.senha()));
        u.setTipo(TipoUsuario.FUNCIONARIO);
        u.setEstado(EstadoUsuario.ATIVO);
        u.setPermissoes(new HashSet<>(permissoes));
        u.setFuncionario(f);
        usuarioRepository.save(u);
        return f;
    }

    @Transactional
    public Funcionario atualizar(Long id, Funcionario dados) {
        Funcionario existente = buscar(id);
        existente.setNome(dados.getNome());
        existente.setEmail(dados.getEmail());
        existente.setEstado(dados.getEstado());
        Funcionario guardado = funcionarioRepository.save(existente);

        // Mantém o utilizador de login em sintonia (estado ATIVO só se o funcionário estiver ATIVO)
        usuarioRepository.findByFuncionarioId(id).ifPresent(u -> {
            u.setNome(guardado.getNome());
            u.setEmail(guardado.getEmail());
            u.setEstado("ATIVO".equalsIgnoreCase(guardado.getEstado())
                    ? EstadoUsuario.ATIVO : EstadoUsuario.BLOQUEADO);
            usuarioRepository.save(u);
        });
        return guardado;
    }

    @Transactional
    public void deletar(Long id) {
        Funcionario f = buscar(id);
        usuarioRepository.findByFuncionarioId(id).ifPresent(usuarioRepository::delete);
        funcionarioRepository.delete(f);
    }
}
