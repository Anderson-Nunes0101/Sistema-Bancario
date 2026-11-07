package mz.nunes.banco.repository;

import mz.nunes.banco.model.Transacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import mz.nunes.banco.model.TipoTransacao;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

    Optional<Transacao> findByReferencia(String referencia);

    Page<Transacao> findAllByOrderByDataHoraDescIdDesc(Pageable pageable);

    @Query("""
           select t from Transacao t
           where t.contaOrigem.id = :contaId or t.contaDestino.id = :contaId
           order by t.dataHora desc, t.id desc
           """)
    Page<Transacao> findExtrato(@Param("contaId") Long contaId, Pageable pageable);

    long countByDataHoraGreaterThanEqual(LocalDateTime desde);

    @Query("select sum(t.valor) from Transacao t where t.tipo = :tipo")
    BigDecimal somaPorTipo(@Param("tipo") TipoTransacao tipo);

    boolean existsByContaOrigemIdOrContaDestinoId(Long origemId, Long destinoId);
}
