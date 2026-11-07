package mz.nunes.banco.repository;

import mz.nunes.banco.model.EstadoUsuario;
import mz.nunes.banco.model.TipoUsuario;
import mz.nunes.banco.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByTipo(TipoUsuario tipo);

    long countByTipo(TipoUsuario tipo);

    long countByTipoAndEstado(TipoUsuario tipo, EstadoUsuario estado);

    Optional<Usuario> findByFuncionarioId(Long funcionarioId);
}
