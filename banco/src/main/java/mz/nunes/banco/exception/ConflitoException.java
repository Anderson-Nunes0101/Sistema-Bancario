package mz.nunes.banco.exception;

/** Operação em conflito com o estado atual dos dados. HTTP 409. */
public class ConflitoException extends RuntimeException {
    public ConflitoException(String message) {
        super(message);
    }
}
