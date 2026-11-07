package mz.nunes.banco.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registo imutável do histórico: depois de criada, uma transação não é alterada nem apagada.
 */
@Entity
@Table(name = "transacoes")
public class Transacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, updatable = false)
    private String referencia;

    /** Nulo nos depósitos. */
    @ManyToOne
    @JoinColumn(name = "conta_origem_id", updatable = false)
    private Conta contaOrigem;

    @ManyToOne
    @JoinColumn(name = "conta_destino_id", nullable = false, updatable = false)
    private Conta contaDestino;

    @Column(updatable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Column(updatable = false)
    private LocalDateTime dataHora;

    @Enumerated(EnumType.STRING)
    @Column(updatable = false)
    private TipoTransacao tipo;

    private String estado;

    /** Saldo da conta de origem imediatamente depois desta transação. */
    @Column(updatable = false, precision = 19, scale = 2)
    private BigDecimal saldoOrigemApos;

    /** Saldo da conta de destino imediatamente depois desta transação. */
    @Column(updatable = false, precision = 19, scale = 2)
    private BigDecimal saldoDestinoApos;

    /** Quem executou: "FUNC:email" ou "CONTA:numero". */
    @Column(updatable = false)
    private String executadoPor;

    @Column(updatable = false)
    private String descricao;

    public Transacao() {
    }

    public Long getId() { return id; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public Conta getContaOrigem() { return contaOrigem; }
    public void setContaOrigem(Conta contaOrigem) { this.contaOrigem = contaOrigem; }

    public Conta getContaDestino() { return contaDestino; }
    public void setContaDestino(Conta contaDestino) { this.contaDestino = contaDestino; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }

    public TipoTransacao getTipo() { return tipo; }
    public void setTipo(TipoTransacao tipo) { this.tipo = tipo; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public BigDecimal getSaldoOrigemApos() { return saldoOrigemApos; }
    public void setSaldoOrigemApos(BigDecimal v) { this.saldoOrigemApos = v; }

    public BigDecimal getSaldoDestinoApos() { return saldoDestinoApos; }
    public void setSaldoDestinoApos(BigDecimal v) { this.saldoDestinoApos = v; }

    public String getExecutadoPor() { return executadoPor; }
    public void setExecutadoPor(String executadoPor) { this.executadoPor = executadoPor; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
}
