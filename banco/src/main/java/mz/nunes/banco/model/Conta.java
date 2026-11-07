package mz.nunes.banco.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contas")
public class Conta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numeroConta;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Hash BCrypt do PIN de 4 dígitos. Nunca guardar nem devolver o PIN em claro. */
    @JsonIgnore
    @Column(nullable = false, length = 100)
    private String pin;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal saldo = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoConta estado = EstadoConta.ATIVA;

    private LocalDateTime dataAbertura = LocalDateTime.now();

    @JsonIgnore
    private int tentativasFalhadas = 0;

    @JsonIgnore
    private LocalDateTime bloqueadoAte;

    public Conta() {
    }

    public Conta(Cliente cliente, String pinHash) {
        this.cliente = cliente;
        this.pin = pinHash;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroConta() { return numeroConta; }
    public void setNumeroConta(String numeroConta) { this.numeroConta = numeroConta; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    @JsonIgnore
    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }

    public EstadoConta getEstado() { return estado; }
    public void setEstado(EstadoConta estado) { this.estado = estado; }

    public LocalDateTime getDataAbertura() { return dataAbertura; }
    public void setDataAbertura(LocalDateTime dataAbertura) { this.dataAbertura = dataAbertura; }

    public int getTentativasFalhadas() { return tentativasFalhadas; }
    public void setTentativasFalhadas(int tentativasFalhadas) { this.tentativasFalhadas = tentativasFalhadas; }

    public LocalDateTime getBloqueadoAte() { return bloqueadoAte; }
    public void setBloqueadoAte(LocalDateTime bloqueadoAte) { this.bloqueadoAte = bloqueadoAte; }
}
