package mz.nunes.banco.controller;

import jakarta.validation.Valid;
import mz.nunes.banco.dto.Dtos.AlterarPinRequest;
import mz.nunes.banco.dto.Dtos.ContaClienteResponse;
import mz.nunes.banco.dto.Dtos.ExtratoItem;
import mz.nunes.banco.dto.Dtos.TransacaoResponse;
import mz.nunes.banco.dto.Dtos.TransferenciaRequest;
import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import mz.nunes.banco.model.Conta;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.service.AuthService;
import mz.nunes.banco.service.TransacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Área do cliente. A conta é SEMPRE a do token (nunca vem do corpo/URL do pedido),
 * por isso um cliente nunca consegue ver ou movimentar contas de outra pessoa.
 * hasRole('CLIENTE') garante que tokens de funcionário/admin não entram aqui.
 */
@RestController
@RequestMapping("/api/minha-conta")
public class MinhaContaController {

    private final ContaRepository contaRepository;
    private final TransacaoService transacaoService;
    private final AuthService authService;

    public MinhaContaController(ContaRepository contaRepository, TransacaoService transacaoService,
                                AuthService authService) {
        this.contaRepository = contaRepository;
        this.transacaoService = transacaoService;
        this.authService = authService;
    }

    private static Long contaId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENTE') and hasAuthority('MINHA_CONTA_CONSULTAR')")
    public ContaClienteResponse conta(@AuthenticationPrincipal Jwt jwt) {
        Conta c = contaRepository.findById(contaId(jwt))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conta não encontrada."));
        return ContaClienteResponse.de(c);
    }

    @GetMapping("/extrato")
    @PreAuthorize("hasRole('CLIENTE') and hasAuthority('MINHA_CONTA_EXTRATO')")
    public List<ExtratoItem> extrato(@AuthenticationPrincipal Jwt jwt,
                                     @RequestParam(defaultValue = "0") int pagina,
                                     @RequestParam(defaultValue = "30") int tamanho) {
        Long id = contaId(jwt);
        return transacaoService.extrato(id, pagina, tamanho).stream()
                .map(t -> ExtratoItem.de(t, id)).toList();
    }

    @PostMapping("/transferencias")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENTE') and hasAuthority('TRANSFERENCIA_REALIZAR')")
    public TransacaoResponse transferir(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody TransferenciaRequest r) {
        String origem = jwt.getClaimAsString("numeroConta");
        return TransacaoResponse.de(transacaoService.transferir(
                origem, r.contaDestino().trim(), r.valor(), "CONTA:" + origem, r.descricao()));
    }

    @PutMapping("/pin")
    @PreAuthorize("hasRole('CLIENTE') and hasAuthority('MINHA_CONTA_ALTERAR_PIN')")
    public Map<String, String> alterarPin(@AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody AlterarPinRequest r) {
        authService.alterarPin(contaId(jwt), r.pinAtual(), r.novoPin());
        return Map.of("message", "PIN alterado com sucesso.");
    }
}
