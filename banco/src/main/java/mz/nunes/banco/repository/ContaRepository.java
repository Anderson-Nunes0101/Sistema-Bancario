package mz.nunes.banco.repository;

import jakarta.persistence.LockModeType;
import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.EstadoConta;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ContaRepository extends JpaRepository<Conta, Long> {

    Optional<Conta> findByNumeroConta(String numeroConta);

    boolean existsByClienteId(Long clienteId);

    long countByEstado(EstadoConta estado);

    @Query("select sum(c.saldo) from Conta c")
    BigDecimal somaSaldos();

    /** SELECT ... FOR UPDATE: impede que dois movimentos alterem o mesmo saldo em simultâneo. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Conta c where c.numeroConta = :numero")
    Optional<Conta> bloquearPorNumero(@Param("numero") String numero);
}
