package mz.nunes.banco.controller;

import jakarta.validation.Valid;
import mz.nunes.banco.dto.Dtos.PermissoesRequest;
import mz.nunes.banco.dto.Dtos.ResumoResponse;
import mz.nunes.banco.dto.Dtos.SenhaRequest;
import mz.nunes.banco.dto.Dtos.UsuarioResponse;
import mz.nunes.banco.security.Permissoes;
import mz.nunes.banco.service.AdminService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    private static Long chamadorId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    @GetMapping("/resumo")
    @PreAuthorize("hasAuthority('SISTEMA_GERIR')")
    public ResumoResponse resumo() {
        return service.resumo();
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasAuthority('FUNCIONARIO_CONSULTAR')")
    public List<UsuarioResponse> usuarios() {
        return service.listarUsuarios().stream().map(UsuarioResponse::de).toList();
    }

    
    @GetMapping("/permissoes")
    @PreAuthorize("hasAnyAuthority('PERMISSAO_GERIR', 'FUNCIONARIO_CRIAR')")
    public List<String> permissoes(Authentication auth) {
        return Permissoes.atribuiveisPor(auth.getAuthorities()).stream().map(Enum::name).sorted().toList();
    }

    @PutMapping("/usuarios/{id}/permissoes")
    @PreAuthorize("hasAuthority('PERMISSAO_GERIR')")
    public UsuarioResponse definirPermissoes(@PathVariable Long id,
                                             @Valid @RequestBody PermissoesRequest r,
                                             Authentication auth) {
        return UsuarioResponse.de(service.definirPermissoes(id, r.permissoes(), auth.getAuthorities()));
    }

    @PatchMapping("/usuarios/{id}/bloquear")
    @PreAuthorize("hasAuthority('FUNCIONARIO_BLOQUEAR')")
    public UsuarioResponse bloquear(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return UsuarioResponse.de(service.alterarEstado(id, true, chamadorId(jwt)));
    }

    @PatchMapping("/usuarios/{id}/desbloquear")
    @PreAuthorize("hasAuthority('FUNCIONARIO_DESBLOQUEAR')")
    public UsuarioResponse desbloquear(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return UsuarioResponse.de(service.alterarEstado(id, false, chamadorId(jwt)));
    }

    @PutMapping("/usuarios/{id}/senha")
    @PreAuthorize("hasAuthority('PERMISSAO_GERIR')")
    public Map<String, String> reporSenha(@PathVariable Long id, @Valid @RequestBody SenhaRequest r,
                                          @AuthenticationPrincipal Jwt jwt) {
        service.reporSenha(id, r.novaSenha(), chamadorId(jwt));
        return Map.of("message", "Senha reposta.");
    }
}
