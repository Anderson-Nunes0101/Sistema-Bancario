package mz.nunes.banco.controller;

import jakarta.validation.Valid;
import mz.nunes.banco.dto.Dtos.ContaCreateRequest;
import mz.nunes.banco.dto.Dtos.ContaResponse;
import mz.nunes.banco.dto.Dtos.ContaUpdateRequest;
import mz.nunes.banco.dto.Dtos.ExtratoItem;
import mz.nunes.banco.model.EstadoConta;
import mz.nunes.banco.service.ContaService;
import mz.nunes.banco.service.TransacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/contas")
public class ContaController {

    private final ContaService service;
    private final TransacaoService transacaoService;

    public ContaController(ContaService service, TransacaoService transacaoService) {
        this.service = service;
        this.transacaoService = transacaoService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CONTA_CONSULTAR')")
    public List<ContaResponse> listarContas() {
        return service.listarContas().stream().map(ContaResponse::de).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CONTA_CONSULTAR')")
    public ContaResponse buscar(@PathVariable Long id) {
        return ContaResponse.de(service.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('CONTA_CRIAR')")
    public ContaResponse criar(@Valid @RequestBody ContaCreateRequest r) {
        return ContaResponse.de(service.criar(r.clienteId(), r.pin()));
    }

    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CONTA_ATUALIZAR')")
    public ContaResponse atualizar(@PathVariable Long id, @Valid @RequestBody ContaUpdateRequest r) {
        return ContaResponse.de(service.atualizar(id, r.novoPin()));
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAuthority('CONTA_DESBLOQUEAR')")
    public ContaResponse ativar(@PathVariable Long id) {
        return ContaResponse.de(service.alterarEstado(id, EstadoConta.ATIVA));
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasAuthority('CONTA_BLOQUEAR')")
    public ContaResponse desativar(@PathVariable Long id) {
        return ContaResponse.de(service.alterarEstado(id, EstadoConta.INATIVA));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('CONTA_ELIMINAR')")
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }

    @GetMapping("/{id}/extrato")
    @PreAuthorize("hasAuthority('EXTRATO_CONSULTAR')")
    public List<ExtratoItem> extrato(@PathVariable Long id,
                                     @RequestParam(defaultValue = "0") int pagina,
                                     @RequestParam(defaultValue = "50") int tamanho) {
        return transacaoService.extrato(id, pagina, tamanho).stream()
                .map(t -> ExtratoItem.de(t, id)).toList();
    }
}
