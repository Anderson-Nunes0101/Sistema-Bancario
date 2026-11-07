package mz.nunes.banco.service;

import mz.nunes.banco.exception.ConflitoException;
import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import mz.nunes.banco.model.Cliente;
import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.EstadoConta;
import mz.nunes.banco.repository.ClienteRepository;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.repository.TransacaoRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ContaService {

    private final ContaRepository contaRepository;
    private final ClienteRepository clienteRepository;
    private final TransacaoRepository transacaoRepository;
    private final PasswordEncoder encoder;

    public ContaService(ContaRepository contaRepository, ClienteRepository clienteRepository,
                        TransacaoRepository transacaoRepository, PasswordEncoder encoder) {
        this.contaRepository = contaRepository;
        this.clienteRepository = clienteRepository;
        this.transacaoRepository = transacaoRepository;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<Conta> listarContas() {
        return contaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Conta buscar(Long id) {
        return contaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conta não encontrada com o ID: " + id));
    }

    /** O funcionário escolhe o PIN (4 dígitos); fica guardado apenas o hash BCrypt. */
    @Transactional
    public Conta criar(Long clienteId, String pin) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Cliente não encontrado com o ID: " + clienteId));

        Conta conta = new Conta(cliente, encoder.encode(pin));
        conta.setSaldo(BigDecimal.ZERO);
        conta.setEstado(EstadoConta.ATIVA);

        // Primeiro guardamos para obter o ID e só depois geramos o número da conta
        conta = contaRepository.saveAndFlush(conta);
        conta.setNumeroConta(String.valueOf(conta.getId() + 11820));
        return contaRepository.save(conta);
    }

    /** Reposição do PIN pelo funcionário (também levanta um bloqueio por tentativas falhadas). */
    @Transactional
    public Conta atualizar(Long id, String novoPin) {
        Conta conta = buscar(id);
        if (novoPin != null) {
            conta.setPin(encoder.encode(novoPin));
            conta.setTentativasFalhadas(0);
            conta.setBloqueadoAte(null);
        }
        return contaRepository.save(conta);
    }

    @Transactional
    public Conta alterarEstado(Long id, EstadoConta estado) {
        Conta conta = buscar(id);
        conta.setEstado(estado);
        return contaRepository.save(conta);
    }

    /** Contas com movimentos não se apagam (o histórico tem de ficar completo): desative-as. */
    @Transactional
    public void deletar(Long id) {
        Conta conta = buscar(id);
        if (conta.getSaldo().signum() != 0) {
            throw new ConflitoException("Não é possível eliminar uma conta com saldo. Desative-a em vez disso.");
        }
        if (transacaoRepository.existsByContaOrigemIdOrContaDestinoId(id, id)) {
            throw new ConflitoException(
                    "A conta tem histórico de transações e não pode ser eliminada. Desative-a em vez disso.");
        }
        contaRepository.delete(conta);
    }
}
