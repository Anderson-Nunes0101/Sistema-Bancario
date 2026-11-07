package mz.nunes.banco.service;

import mz.nunes.banco.dto.Dtos.LoginResponse;
import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import mz.nunes.banco.exception.RegraNegocioException;
import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.EstadoConta;
import mz.nunes.banco.model.EstadoUsuario;
import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.model.TipoUsuario;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.repository.UsuarioRepository;
import mz.nunes.banco.security.JwtService;
import mz.nunes.banco.security.Permissoes;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final int MAX_TENTATIVAS = 5;
    private static final long BLOQUEIO_MINUTOS = 15;

    private final UsuarioRepository usuarioRepository;
    private final ContaRepository contaRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    /** Usado para gastar o mesmo tempo quando o utilizador/conta não existe (evita enumeração). */
    private final String hashFalso;

    public AuthService(UsuarioRepository usuarioRepository, ContaRepository contaRepository,
                       PasswordEncoder encoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.contaRepository = contaRepository;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.hashFalso = encoder.encode("hash-falso-para-igualar-tempo");
    }

    // noRollbackFor: o contador de tentativas falhadas tem de ser gravado mesmo quando se lança a exceção.
    @Transactional(noRollbackFor = AuthenticationException.class)
    public LoginResponse loginFuncionario(String email, String senha) {
        Usuario u = usuarioRepository.findByEmailIgnoreCase(email.trim())
                .filter(x -> x.getTipo() != TipoUsuario.CLIENTE)
                .orElse(null);
        if (u == null) {
            encoder.matches(senha, hashFalso);
            throw credenciaisInvalidas();
        }

        LocalDateTime agora = LocalDateTime.now();
        if (u.getBloqueadoAte() != null) {
            if (agora.isBefore(u.getBloqueadoAte())) {
                throw bloqueioTemporario(agora, u.getBloqueadoAte());
            }
            u.setBloqueadoAte(null);
            u.setTentativasFalhadas(0);
        }

        if (!encoder.matches(senha, u.getSenha())) {
            int t = u.getTentativasFalhadas() + 1;
            if (t >= MAX_TENTATIVAS) {
                u.setBloqueadoAte(agora.plusMinutes(BLOQUEIO_MINUTOS));
                t = 0;
            }
            u.setTentativasFalhadas(t);
            usuarioRepository.save(u);
            throw credenciaisInvalidas();
        }

        u.setTentativasFalhadas(0);
        usuarioRepository.save(u);

        if (u.getEstado() != EstadoUsuario.ATIVO) {
            throw new DisabledException("Utilizador bloqueado. Contacte o administrador.");
        }

        Set<Permissao> permissoes = Permissoes.efetivas(u);
        JwtService.Token token = jwtService.gerar(
                String.valueOf(u.getId()), u.getTipo(), permissoes,
                Map.of("nome", u.getNome(), "email", u.getEmail()));

        return new LoginResponse(token.valor(), token.expiraEm(), u.getTipo().name(), u.getNome(),
                nomes(permissoes), null, null);
    }

    @Transactional(noRollbackFor = AuthenticationException.class)
    public LoginResponse loginCliente(String numeroConta, String pin) {
        Conta c = contaRepository.findByNumeroConta(numeroConta.trim()).orElse(null);
        if (c == null) {
            encoder.matches(pin, hashFalso);
            throw credenciaisInvalidas();
        }

        verificarPin(c, pin);

        // O estado só é revelado depois de o PIN estar certo.
        if (c.getEstado() != EstadoConta.ATIVA) {
            throw new DisabledException("Conta inativa. Dirija-se ao balcão do banco.");
        }

        Set<Permissao> permissoes = Permissoes.CLIENTE;
        JwtService.Token token = jwtService.gerar(
                String.valueOf(c.getId()), TipoUsuario.CLIENTE, permissoes,
                Map.of("numeroConta", c.getNumeroConta()));

        return new LoginResponse(token.valor(), token.expiraEm(), TipoUsuario.CLIENTE.name(),
                c.getCliente().getNome(), nomes(permissoes), c.getId(), c.getNumeroConta());
    }

    @Transactional(noRollbackFor = {AuthenticationException.class, RegraNegocioException.class})
    public void alterarPin(Long contaId, String pinAtual, String novoPin) {
        Conta c = contaRepository.findById(contaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conta não encontrada."));

        try {
            verificarPin(c, pinAtual);
        } catch (BadCredentialsException e) {
            // 422 (e não 401) para a app não confundir "PIN atual errado" com "sessão expirada".
            throw new RegraNegocioException("O PIN atual está incorreto.");
        }

        if (encoder.matches(novoPin, c.getPin())) {
            throw new RegraNegocioException("O novo PIN deve ser diferente do atual.");
        }
        c.setPin(encoder.encode(novoPin));
        contaRepository.save(c);
    }

    /** Valida o PIN aplicando o bloqueio temporário após demasiadas tentativas. */
    private void verificarPin(Conta c, String pin) {
        LocalDateTime agora = LocalDateTime.now();
        if (c.getBloqueadoAte() != null) {
            if (agora.isBefore(c.getBloqueadoAte())) {
                throw bloqueioTemporario(agora, c.getBloqueadoAte());
            }
            c.setBloqueadoAte(null);
            c.setTentativasFalhadas(0);
        }

        if (!encoder.matches(pin, c.getPin())) {
            int t = c.getTentativasFalhadas() + 1;
            if (t >= MAX_TENTATIVAS) {
                c.setBloqueadoAte(agora.plusMinutes(BLOQUEIO_MINUTOS));
                t = 0;
            }
            c.setTentativasFalhadas(t);
            contaRepository.save(c);
            throw credenciaisInvalidas();
        }

        c.setTentativasFalhadas(0);
        contaRepository.save(c);
    }

    private static BadCredentialsException credenciaisInvalidas() {
        return new BadCredentialsException("Credenciais inválidas.");
    }

    private static LockedException bloqueioTemporario(LocalDateTime agora, LocalDateTime ate) {
        long min = Math.max(1, Duration.between(agora, ate).toMinutes() + 1);
        return new LockedException("Demasiadas tentativas falhadas. Tente novamente dentro de "
                + min + " minuto(s).");
    }

    private static Set<String> nomes(Set<Permissao> permissoes) {
        return permissoes.stream().map(Enum::name).collect(Collectors.toCollection(java.util.TreeSet::new));
    }
}
