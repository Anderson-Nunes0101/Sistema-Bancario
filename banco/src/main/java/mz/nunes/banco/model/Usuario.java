package mz.nunes.banco.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
    name = "usuarios",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_usuario_funcionario",
            columnNames = "funcionario_id"
        ),
        @UniqueConstraint(
            name = "uk_usuario_cliente",
            columnNames = "cliente_id"
        )
    }
)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome é obrigatório")
    @Column(nullable = false)
    private String nome;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @NotBlank(message = "A senha é obrigatória")
    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoUsuario tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoUsuario estado = EstadoUsuario.ATIVO;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "usuario_permissoes",
        joinColumns = @JoinColumn(name = "usuario_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "permissao", columnDefinition = "varchar(50)")
    private Set<Permissao> permissoes = new HashSet<>();

    @OneToOne
    @JoinColumn(name = "funcionario_id", unique = true)
    @JsonIgnore
    private Funcionario funcionario;

    @OneToOne
    @JoinColumn(name = "cliente_id", unique = true)
    @JsonIgnore
    private Cliente cliente;

    @JsonIgnore
    private int tentativasFalhadas = 0;

    @JsonIgnore
    private java.time.LocalDateTime bloqueadoAte;

    public Usuario() {
    }

    public int getTentativasFalhadas() { return tentativasFalhadas; }
    public void setTentativasFalhadas(int t) { this.tentativasFalhadas = t; }

    public java.time.LocalDateTime getBloqueadoAte() { return bloqueadoAte; }
    public void setBloqueadoAte(java.time.LocalDateTime b) { this.bloqueadoAte = b; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @JsonIgnore
    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public TipoUsuario getTipo() {
        return tipo;
    }

    public void setTipo(TipoUsuario tipo) {
        this.tipo = tipo;
    }

    public EstadoUsuario getEstado() {
        return estado;
    }

    public void setEstado(EstadoUsuario estado) {
        this.estado = estado;
    }

    public Set<Permissao> getPermissoes() {
        return permissoes;
    }

    public void setPermissoes(Set<Permissao> permissoes) {
        this.permissoes = permissoes;
    }

    public Funcionario getFuncionario() {
        return funcionario;
    }

    public void setFuncionario(Funcionario funcionario) {
        this.funcionario = funcionario;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }
}
