package mz.nunes.banco.security;

import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.model.TipoUsuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Map;

@Service
public class JwtService {

    public record Token(String valor, Instant expiraEm) {
    }

    private final JwtEncoder encoder;
    private final long expiracaoMinutos;

    public JwtService(JwtEncoder encoder,
                      @Value("${app.jwt.expiracao-minutos:60}") long expiracaoMinutos) {
        this.encoder = encoder;
        this.expiracaoMinutos = expiracaoMinutos;
    }

    /**
     * subject = id do utilizador (funcionário/admin) ou id da conta (cliente).
     * O claim "tipo" diz como interpretar o subject.
     */
    public Token gerar(String subject, TipoUsuario tipo, Collection<Permissao> permissoes,
                       Map<String, Object> extra) {
        Instant agora = Instant.now();
        Instant expira = agora.plus(expiracaoMinutos, ChronoUnit.MINUTES);

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer("banco")
                .issuedAt(agora)
                .expiresAt(expira)
                .subject(subject)
                .claim("tipo", tipo.name())
                .claim("permissoes", permissoes.stream().map(Enum::name).sorted().toList());
        extra.forEach(claims::claim);

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String valor = encoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
        return new Token(valor, expira);
    }
}
