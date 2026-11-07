package mz.nunes.banco.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.security.Permissoes;
import mz.nunes.banco.model.Transacao;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public final class Dtos {

    private Dtos() {
    }

    public static final String PIN_REGEX = "^\\d{4}$";
    public static final String PIN_MSG = "O PIN deve ter exatamente 4 dígitos";

    // ---------- Autenticação ----------

    public record LoginFuncionarioRequest(
            @NotBlank(message = "O email é obrigatório") String email,
            @NotBlank(message = "A senha é obrigatória") String senha) {
    }

    public record LoginClienteRequest(
            @NotBlank(message = "O número da conta é obrigatório") String numeroConta,
            @NotBlank(message = "O PIN é obrigatório") String pin) {
    }

    public record LoginResponse(
            String token,
            Instant expiraEm,
            String tipo,
            String nome,
            Set<String> permissoes,
            Long contaId,
            String numeroConta) {
    }

    // ---------- Funcionários ----------

    public record FuncionarioRequest(
            @NotBlank(message = "O nome do funcionário é obrigatório") String nome,
            @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email,
            @NotBlank(message = "A senha é obrigatória")
            @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String senha,
            /** Opcional: se omitido, aplica-se o pacote padrão de funcionário. */
            Set<Permissao> permissoes) {
    }

    public record PermissoesRequest(@NotNull(message = "A lista de permissões é obrigatória") Set<Permissao> permissoes) {
    }

    public record SenhaRequest(
            @NotBlank(message = "A nova senha é obrigatória")
            @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String novaSenha) {
    }

    public record UsuarioResponse(
            Long id,
            String nome,
            String email,
            String tipo,
            String estado,
            List<String> permissoes,
            Long funcionarioId,
            LocalDateTime bloqueadoAte) {

        public static UsuarioResponse de(Usuario u) {
            List<String> p = Permissoes.efetivas(u).stream().map(Enum::name).sorted().toList();
            return new UsuarioResponse(
                    u.getId(), u.getNome(), u.getEmail(), u.getTipo().name(), u.getEstado().name(), p,
                    u.getFuncionario() != null ? u.getFuncionario().getId() : null, u.getBloqueadoAte());
        }
    }

    public record ResumoResponse(
            long clientes,
            long contasAtivas,
            long contasInativas,
            BigDecimal saldoTotal,
            long funcionarios,
            long funcionariosBloqueados,
            long transacoes,
            long transacoesHoje,
            BigDecimal totalDepositado) {
    }

    // ---------- Contas ----------

    public record ContaCreateRequest(
            @NotNull(message = "O cliente é obrigatório") Long clienteId,
            @NotBlank(message = PIN_MSG) @Pattern(regexp = PIN_REGEX, message = PIN_MSG) String pin) {
    }

    /** novoPin opcional: se vier preenchido, o PIN da conta é reposto. */
    public record ContaUpdateRequest(
            @Pattern(regexp = PIN_REGEX, message = PIN_MSG) String novoPin) {
    }

    public record AlterarPinRequest(
            @NotBlank(message = "O PIN atual é obrigatório") String pinAtual,
            @NotBlank(message = PIN_MSG) @Pattern(regexp = PIN_REGEX, message = PIN_MSG) String novoPin) {
    }

    public record ContaResponse(
            Long id,
            String numeroConta,
            BigDecimal saldo,
            String estado,
            LocalDateTime dataAbertura,
            Long clienteId,
            String clienteNome) {

        public static ContaResponse de(Conta c) {
            return new ContaResponse(
                    c.getId(), c.getNumeroConta(), c.getSaldo(), c.getEstado().name(), c.getDataAbertura(),
                    c.getCliente().getId(), c.getCliente().getNome());
        }
    }

    public record ContaClienteResponse(
            String numeroConta,
            String titular,
            BigDecimal saldo,
            String estado,
            LocalDateTime dataAbertura) {

        public static ContaClienteResponse de(Conta c) {
            return new ContaClienteResponse(
                    c.getNumeroConta(), c.getCliente().getNome(), c.getSaldo(),
                    c.getEstado().name(), c.getDataAbertura());
        }
    }

    // ---------- Transações ----------

    public record DepositoRequest(
            @NotBlank(message = "A conta de destino é obrigatória") String contaDestino,
            @NotNull(message = "O valor é obrigatório")
            @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero") BigDecimal valor,
            @Size(max = 140, message = "A descrição pode ter no máximo 140 caracteres") String descricao) {
    }

    public record TransferenciaRequest(
            @NotBlank(message = "A conta de destino é obrigatória") String contaDestino,
            @NotNull(message = "O valor é obrigatório")
            @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero") BigDecimal valor,
            @Size(max = 140, message = "A descrição pode ter no máximo 140 caracteres") String descricao) {
    }

    public record TransacaoResponse(
            String referencia,
            String tipo,
            String contaOrigem,
            String contaDestino,
            BigDecimal valor,
            LocalDateTime dataHora,
            String estado,
            BigDecimal saldoOrigemApos,
            BigDecimal saldoDestinoApos,
            String executadoPor,
            String descricao) {

        public static TransacaoResponse de(Transacao t) {
            return new TransacaoResponse(
                    t.getReferencia(), t.getTipo().name(),
                    t.getContaOrigem() != null ? t.getContaOrigem().getNumeroConta() : null,
                    t.getContaDestino().getNumeroConta(),
                    t.getValor(), t.getDataHora(), t.getEstado(),
                    t.getSaldoOrigemApos(), t.getSaldoDestinoApos(),
                    t.getExecutadoPor(), t.getDescricao());
        }
    }

    /** Linha de extrato vista da perspetiva de uma conta (CREDITO entra, DEBITO sai). */
    public record ExtratoItem(
            String referencia,
            String tipo,
            String sentido,
            String contraparte,
            BigDecimal valor,
            BigDecimal saldoApos,
            LocalDateTime dataHora,
            String descricao) {

        public static ExtratoItem de(Transacao t, Long contaId) {
            boolean credito = t.getContaDestino().getId().equals(contaId);
            String contraparte;
            BigDecimal saldoApos;
            if (credito) {
                contraparte = t.getContaOrigem() != null ? t.getContaOrigem().getNumeroConta() : null;
                saldoApos = t.getSaldoDestinoApos();
            } else {
                contraparte = t.getContaDestino().getNumeroConta();
                saldoApos = t.getSaldoOrigemApos();
            }
            return new ExtratoItem(
                    t.getReferencia(), t.getTipo().name(), credito ? "CREDITO" : "DEBITO",
                    contraparte, t.getValor(), saldoApos, t.getDataHora(), t.getDescricao());
        }
    }
}
