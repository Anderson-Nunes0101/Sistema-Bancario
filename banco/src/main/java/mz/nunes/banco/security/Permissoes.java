package mz.nunes.banco.security;

import mz.nunes.banco.exception.RegraNegocioException;
import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.model.TipoUsuario;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import static mz.nunes.banco.model.Permissao.*;

/** Conjuntos de permissões por perfil. */
public final class Permissoes {

    private Permissoes() {
    }

    /** Atribuídas por omissão ao criar um funcionário (podem ser ajustadas depois). */
    public static final Set<Permissao> FUNCIONARIO = EnumSet.of(
            CLIENTE_CRIAR, CLIENTE_CONSULTAR, CLIENTE_ATUALIZAR, CLIENTE_ELIMINAR,
            CONTA_CRIAR, CONTA_CONSULTAR, CONTA_ATUALIZAR, CONTA_ELIMINAR,
            CONTA_BLOQUEAR, CONTA_DESBLOQUEAR,
            DEPOSITO_REALIZAR, TRANSACAO_CONSULTAR, EXTRATO_CONSULTAR);

    /** Permissões do cliente: só atuam sobre a PRÓPRIA conta (o id vem sempre do token). */
    public static final Set<Permissao> CLIENTE = EnumSet.of(
            MINHA_CONTA_CONSULTAR, MINHA_CONTA_EXTRATO, MINHA_CONTA_ALTERAR_PIN, TRANSFERENCIA_REALIZAR);

    /** Nunca podem ser atribuídas a funcionários. */
    public static final Set<Permissao> APENAS_CLIENTE = CLIENTE;

    public static Set<Permissao> efetivas(Usuario u) {
        if (u.getTipo() == TipoUsuario.ADMIN) {
            return EnumSet.allOf(Permissao.class);
        }
        Set<Permissao> p = EnumSet.noneOf(Permissao.class);
        p.addAll(u.getPermissoes());
        return p;
    }

    /** Permissões que podem ser atribuídas a funcionários. */
    public static Set<Permissao> atribuiveis() {
        Set<Permissao> p = EnumSet.allOf(Permissao.class);
        p.removeAll(APENAS_CLIENTE);
        return p;
    }

    private static Set<String> nomes(Collection<? extends GrantedAuthority> autoridades) {
        return autoridades.stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
    }

    /** Permissões atribuíveis que quem chama também possui. */
    public static Set<Permissao> atribuiveisPor(Collection<? extends GrantedAuthority> chamador) {
        Set<String> tem = nomes(chamador);
        Set<Permissao> p = EnumSet.noneOf(Permissao.class);
        for (Permissao x : atribuiveis()) {
            if (tem.contains(x.name())) p.add(x);
        }
        return p;
    }

    /** Pacote por omissão, limitado ao que quem cria também possui. */
    public static Set<Permissao> padraoPara(Collection<? extends GrantedAuthority> chamador) {
        Set<Permissao> p = EnumSet.noneOf(Permissao.class);
        p.addAll(FUNCIONARIO);
        p.retainAll(atribuiveisPor(chamador));
        return p;
    }

    /** Ninguém concede o que não tem, e permissões de cliente não vão para funcionários. */
    public static void validarConcessao(Collection<? extends GrantedAuthority> chamador, Set<Permissao> pedidas) {
        Set<String> tem = nomes(chamador);
        for (Permissao p : pedidas) {
            if (APENAS_CLIENTE.contains(p)) {
                throw new RegraNegocioException("A permissão " + p + " é só para clientes.");
            }
            if (!tem.contains(p.name())) {
                throw new AccessDeniedException("Não pode conceder a permissão " + p + " porque não a possui.");
            }
        }
    }
}
