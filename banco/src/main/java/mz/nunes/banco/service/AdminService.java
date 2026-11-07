package mz.nunes.banco.service;

import mz.nunes.banco.dto.Dtos.ResumoResponse;
import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import mz.nunes.banco.exception.RegraNegocioException;
import mz.nunes.banco.model.EstadoConta;
import mz.nunes.banco.model.EstadoUsuario;
import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.model.TipoTransacao;
import mz.nunes.banco.model.TipoUsuario;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.repository.ClienteRepository;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.repository.TransacaoRepository;
import mz.nunes.banco.repository.UsuarioRepository;
import mz.nunes.banco.security.Permissoes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


@Service
public class AdminService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final ContaRepository contaRepository;
    private final TransacaoRepository transacaoRepository;
    private final PasswordEncoder encoder;

    public AdminService(UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
                        ContaRepository contaRepository, TransacaoRepository transacaoRepository,
                        PasswordEncoder encoder) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.contaRepository = contaRepository;
        this.transacaoRepository = transacaoRepository;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll().stream()
                .filter(u -> u.getTipo() != TipoUsuario.CLIENTE)
                .toList();
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .filter(u -> u.getTipo() != TipoUsuario.CLIENTE)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Utilizador não encontrado com o ID: " + id));
    }

    @Transactional
    public Usuario definirPermissoes(Long id, Set<Permissao> novas,
                                     Collection<? extends GrantedAuthority> chamador) {
        Usuario u = buscar(id);
        if (u.getTipo() == TipoUsuario.ADMIN) {
            throw new RegraNegocioException("O administrador tem sempre todas as permissões.");
        }
        // Só se valida o que é ADICIONADO: manter ou retirar permissões que o chamador não tem é permitido.
        Set<Permissao> adicionadas = new HashSet<>(novas);
        adicionadas.removeAll(u.getPermissoes());
        Permissoes.validarConcessao(chamador, adicionadas);

        u.setPermissoes(new HashSet<>(novas));
        return usuarioRepository.save(u);
    }

    @Transactional
    public Usuario alterarEstado(Long id, boolean bloquear, Long chamadorId) {
        Usuario u = buscar(id);
        if (bloquear) {
            if (u.getId().equals(chamadorId)) {
                throw new RegraNegocioException("Não pode bloquear a sua própria conta.");
            }
            if (u.getTipo() == TipoUsuario.ADMIN) {
                throw new RegraNegocioException("O administrador não pode ser bloqueado.");
            }
            u.setEstado(EstadoUsuario.BLOQUEADO);
        } else {
            u.setEstado(EstadoUsuario.ATIVO);
            u.setTentativasFalhadas(0);
            u.setBloqueadoAte(null);
        }
        if (u.getFuncionario() != null) {
            u.getFuncionario().setEstado(bloquear ? "BLOQUEADO" : "ATIVO");
        }
        return usuarioRepository.save(u);
    }

    @Transactional
    public void reporSenha(Long id, String novaSenha, Long chamadorId) {
        Usuario u = buscar(id);
        if (u.getTipo() == TipoUsuario.ADMIN && !u.getId().equals(chamadorId)) {
            throw new RegraNegocioException("Só o próprio administrador pode alterar a sua senha.");
        }
        u.setSenha(encoder.encode(novaSenha));
        u.setTentativasFalhadas(0);
        u.setBloqueadoAte(null);
        usuarioRepository.save(u);
    }

    @Transactional(readOnly = true)
    public ResumoResponse resumo() {
        BigDecimal saldo = contaRepository.somaSaldos();
        BigDecimal depositado = transacaoRepository.somaPorTipo(TipoTransacao.DEPOSITO);
        return new ResumoResponse(
                clienteRepository.count(),
                contaRepository.countByEstado(EstadoConta.ATIVA),
                contaRepository.countByEstado(EstadoConta.INATIVA),
                saldo != null ? saldo : BigDecimal.ZERO,
                usuarioRepository.countByTipo(TipoUsuario.FUNCIONARIO),
                usuarioRepository.countByTipoAndEstado(TipoUsuario.FUNCIONARIO, EstadoUsuario.BLOQUEADO),
                transacaoRepository.count(),
                transacaoRepository.countByDataHoraGreaterThanEqual(LocalDate.now().atStartOfDay()),
                depositado != null ? depositado : BigDecimal.ZERO);
    }
}
