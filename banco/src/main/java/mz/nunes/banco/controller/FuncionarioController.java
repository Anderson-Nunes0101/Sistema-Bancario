package mz.nunes.banco.controller;

import jakarta.validation.Valid;
import mz.nunes.banco.dto.Dtos.FuncionarioRequest;
import mz.nunes.banco.model.Funcionario;
import mz.nunes.banco.model.Permissao;
import mz.nunes.banco.security.Permissoes;
import mz.nunes.banco.service.FuncionarioService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/funcionarios")
public class FuncionarioController {

    private final FuncionarioService service;

    public FuncionarioController(FuncionarioService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('FUNCIONARIO_CONSULTAR')")
    public List<Funcionario> listarFuncionarios() {
        return service.listarFuncionarios();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('FUNCIONARIO_CONSULTAR')")
    public Funcionario buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** Cadastro de funcionário (com senha de acesso). Só quem tem FUNCIONARIO_CRIAR (admin). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('FUNCIONARIO_CRIAR')")
    public Funcionario criar(@Valid @RequestBody FuncionarioRequest dados, Authentication auth) {
        Set<Permissao> permissoes;
        if (dados.permissoes() == null) {
            permissoes = Permissoes.padraoPara(auth.getAuthorities());
        } else {
            Permissoes.validarConcessao(auth.getAuthorities(), dados.permissoes());
            permissoes = dados.permissoes();
        }
        return service.criar(dados, permissoes);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FUNCIONARIO_ATUALIZAR')")
    public Funcionario atualizar(@PathVariable Long id, @Valid @RequestBody Funcionario funcionario) {
        return service.atualizar(id, funcionario);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('FUNCIONARIO_ELIMINAR')")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }
}
