package mz.nunes.banco.service;

import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import mz.nunes.banco.exception.RegraNegocioException;
import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.EstadoConta;
import mz.nunes.banco.model.TipoTransacao;
import mz.nunes.banco.model.Transacao;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.repository.TransacaoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransacaoService {

    private static final String CONCLUIDA = "CONCLUIDA";
    private static final BigDecimal LIMITE = new BigDecimal("1000000000");

    private final TransacaoRepository repository;
    private final ContaRepository contaRepository;

    public TransacaoService(TransacaoRepository repository, ContaRepository contaRepository) {
        this.repository = repository;
        this.contaRepository = contaRepository;
    }

    // ---------- Consultas ----------

    @Transactional(readOnly = true)
    public List<Transacao> listarTransacoes(int pagina, int tamanho) {
        return repository.findAllByOrderByDataHoraDescIdDesc(pageable(pagina, tamanho)).getContent();
    }

    @Transactional(readOnly = true)
    public Transacao buscar(String referencia) {
        return repository.findByReferencia(referencia)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Transação não encontrada: " + referencia));
    }

    /** Histórico completo de uma conta (entradas e saídas), do mais recente para o mais antigo. */
    @Transactional(readOnly = true)
    public List<Transacao> extrato(Long contaId, int pagina, int tamanho) {
        if (!contaRepository.existsById(contaId)) {
            throw new RecursoNaoEncontradoException("Conta não encontrada com o ID: " + contaId);
        }
        return repository.findExtrato(contaId, pageable(pagina, tamanho)).getContent();
    }

    // ---------- Operações ----------

    @Transactional
    public Transacao depositar(String destino, BigDecimal valor, String executadoPor, String descricao) {
        valor = validarValor(valor);

        Conta contaDestino = bloquear(destino, "destino");
        exigirAtiva(contaDestino, "destino");

        contaDestino.setSaldo(contaDestino.getSaldo().add(valor));
        contaRepository.save(contaDestino);

        return registar(TipoTransacao.DEPOSITO, null, contaDestino, valor, executadoPor, descricao);
    }

    @Transactional
    public Transacao transferir(String origem, String destino, BigDecimal valor,
                                String executadoPor, String descricao) {
        valor = validarValor(valor);

        if (origem.equals(destino)) {
            throw new RegraNegocioException("Não pode transferir para a mesma conta.");
        }

        // Bloqueio sempre pela mesma ordem (número da conta) para evitar deadlocks entre transferências cruzadas
        Conta contaOrigem;
        Conta contaDestino;
        if (origem.compareTo(destino) < 0) {
            contaOrigem = bloquear(origem, "origem");
            contaDestino = bloquear(destino, "destino");
        } else {
            contaDestino = bloquear(destino, "destino");
            contaOrigem = bloquear(origem, "origem");
        }

        exigirAtiva(contaOrigem, "origem");
        exigirAtiva(contaDestino, "destino");

        if (contaOrigem.getSaldo().compareTo(valor) < 0) {
            throw new RegraNegocioException("Saldo insuficiente.");
        }

        contaOrigem.setSaldo(contaOrigem.getSaldo().subtract(valor));
        contaDestino.setSaldo(contaDestino.getSaldo().add(valor));
        contaRepository.save(contaOrigem);
        contaRepository.save(contaDestino);

        return registar(TipoTransacao.TRANSFERENCIA, contaOrigem, contaDestino, valor, executadoPor, descricao);
    }

    // ---------- Auxiliares ----------

    private Transacao registar(TipoTransacao tipo, Conta origem, Conta destino, BigDecimal valor,
                               String executadoPor, String descricao) {
        Transacao t = new Transacao();
        t.setReferencia(UUID.randomUUID().toString());
        t.setTipo(tipo);
        t.setContaOrigem(origem);
        t.setContaDestino(destino);
        t.setValor(valor);
        t.setDataHora(LocalDateTime.now());
        t.setEstado(CONCLUIDA);
        t.setSaldoOrigemApos(origem != null ? origem.getSaldo() : null);
        t.setSaldoDestinoApos(destino.getSaldo());
        t.setExecutadoPor(executadoPor);
        t.setDescricao(descricao == null || descricao.isBlank() ? null : descricao.trim());
        return repository.save(t);
    }

    private Conta bloquear(String numeroConta, String papel) {
        return contaRepository.bloquearPorNumero(numeroConta.trim())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conta de " + papel + " não encontrada."));
    }

    private void exigirAtiva(Conta conta, String papel) {
        if (conta.getEstado() != EstadoConta.ATIVA) {
            throw new RegraNegocioException("A conta de " + papel + " está inativa.");
        }
    }

    private BigDecimal validarValor(BigDecimal valor) {
        if (valor == null || valor.signum() <= 0) {
            throw new RegraNegocioException("O valor deve ser maior que zero.");
        }
        if (valor.stripTrailingZeros().scale() > 2) {
            throw new RegraNegocioException("O valor deve ter no máximo 2 casas decimais.");
        }
        if (valor.compareTo(LIMITE) > 0) {
            throw new RegraNegocioException("Valor acima do limite permitido por operação.");
        }
        return valor.setScale(2, RoundingMode.UNNECESSARY);
    }

    private PageRequest pageable(int pagina, int tamanho) {
        return PageRequest.of(Math.max(0, pagina), Math.min(Math.max(1, tamanho), 200));
    }
}
