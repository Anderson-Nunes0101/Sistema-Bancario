package mz.nunes.banco.exception;

/** Violação de uma regra de negócio (ex.: conta inativa, saldo insuficiente). HTTP 422. */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String message) {
        super(message);
    }
}
