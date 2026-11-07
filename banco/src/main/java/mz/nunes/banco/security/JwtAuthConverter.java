package mz.nunes.banco.security;

import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.EstadoConta;
import mz.nunes.banco.model.EstadoUsuario;
import mz.nunes.banco.model.TipoUsuario;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.repository.UsuarioRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Em cada pedido, depois de validar a assinatura/expiração do token, confirma na base de dados que
 * o utilizador/conta continua ativo e usa as permissões ATUAIS (não as que estavam no token).
 * Assim, desativar uma conta ou retirar uma permissão tem efeito imediato.
 */
@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UsuarioRepository usuarioRepository;
    private final ContaRepository contaRepository;

    public JwtAuthConverter(UsuarioRepository usuarioRepository, ContaRepository contaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.contaRepository = contaRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        TipoUsuario tipo;
        long id;
        try {
            tipo = TipoUsuario.valueOf(jwt.getClaimAsString("tipo"));
            id = Long.parseLong(jwt.getSubject());
        } catch (RuntimeException e) {
            throw new BadCredentialsException("Token inválido.");
        }

        Set<GrantedAuthority> autoridades = new HashSet<>();

        if (tipo == TipoUsuario.CLIENTE) {
            Conta conta = contaRepository.findById(id)
                    .orElseThrow(() -> new BadCredentialsException("Sessão inválida."));
            if (conta.getEstado() != EstadoConta.ATIVA) {
                throw new BadCredentialsException("Conta inativa.");
            }
            Permissoes.CLIENTE.forEach(p -> autoridades.add(new SimpleGrantedAuthority(p.name())));
        } else {
            Usuario usuario = usuarioRepository.findById(id)
                    .orElseThrow(() -> new BadCredentialsException("Sessão inválida."));
            if (usuario.getEstado() != EstadoUsuario.ATIVO || usuario.getTipo() != tipo) {
                throw new BadCredentialsException("Utilizador inativo.");
            }
            Permissoes.efetivas(usuario).forEach(p -> autoridades.add(new SimpleGrantedAuthority(p.name())));
        }

        autoridades.add(new SimpleGrantedAuthority("ROLE_" + tipo.name()));
        return new JwtAuthenticationToken(jwt, autoridades, jwt.getSubject());
    }
}
