package mz.nunes.banco.repository;
import mz.nunes.banco.model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

}
