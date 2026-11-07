package mz.nunes.banco.controller;

import jakarta.validation.Valid;
import mz.nunes.banco.dto.Dtos.DepositoRequest;
import mz.nunes.banco.dto.Dtos.TransacaoResponse;
import mz.nunes.banco.service.TransacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Histórico geral e depósitos (funcionário). As transações são imutáveis:
 * não existe atualização nem eliminação.
 */
@RestController
@RequestMapping("/api/transacoes")
public class TransacaoController {

    private final TransacaoService service;

    public TransacaoController(TransacaoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('TRANSACAO_CONSULTAR')")
    public List<TransacaoResponse> listar(@RequestParam(defaultValue = "0") int pagina,
                                          @RequestParam(defaultValue = "50") int tamanho) {
        return service.listarTransacoes(pagina, tamanho).stream().map(TransacaoResponse::de).toList();
    }

    @GetMapping("/{referencia}")
    @PreAuthorize("hasAuthority('TRANSACAO_CONSULTAR')")
    public TransacaoResponse buscar(@PathVariable String referencia) {
        return TransacaoResponse.de(service.buscar(referencia));
    }

    @PostMapping("/depositos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DEPOSITO_REALIZAR')")
    public TransacaoResponse depositar(@Valid @RequestBody DepositoRequest r, Authentication auth) {
        Jwt jwt = (Jwt) auth.getPrincipal();
        String quem = "FUNC:" + jwt.getClaimAsString("email");
        return TransacaoResponse.de(service.depositar(r.contaDestino(), r.valor(), quem, r.descricao()));
    }
}
