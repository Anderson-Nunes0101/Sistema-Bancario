package mz.nunes.banco.service;

import mz.nunes.banco.model.Conta;
import mz.nunes.banco.model.EstadoUsuario;
import mz.nunes.banco.model.TipoUsuario;
import mz.nunes.banco.model.Usuario;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/**
 * No arranque: (1) cria o administrador inicial se não existir nenhum;
 * (2) cifra PINs que ainda estejam em texto simples (dados anteriores à autenticação).
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final UsuarioRepository usuarioRepository;
    private final ContaRepository contaRepository;
    private final PasswordEncoder encoder;
    private final String adminEmail;
    private final String adminSenha;

    public DataInitializer(UsuarioRepository usuarioRepository, ContaRepository contaRepository,
                           PasswordEncoder encoder,
                           @Value("${app.admin.email}") String adminEmail,
                           @Value("${app.admin.senha:}") String adminSenha) {
        this.usuarioRepository = usuarioRepository;
        this.contaRepository = contaRepository;
        this.encoder = encoder;
        this.adminEmail = adminEmail;
        this.adminSenha = adminSenha;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        criarAdminInicial();
        cifrarPinsAntigos();
    }

    private void criarAdminInicial() {
        if (usuarioRepository.existsByTipo(TipoUsuario.ADMIN)) {
            return;
        }
        boolean gerada = adminSenha == null || adminSenha.isBlank();
        String senha = gerada ? senhaAleatoria(16) : adminSenha;

        Usuario admin = new Usuario();
        admin.setNome("Administrador");
        admin.setEmail(adminEmail);
        admin.setSenha(encoder.encode(senha));
        admin.setTipo(TipoUsuario.ADMIN);
        admin.setEstado(EstadoUsuario.ATIVO);
        usuarioRepository.save(admin);

        if (gerada) {
            log.warn("ADMIN criado: {} | senha temporária (mostrada só desta vez): {}", adminEmail, senha);
        } else {
            log.info("ADMIN criado: {}", adminEmail);
        }
    }

    private void cifrarPinsAntigos() {
        int n = 0;
        for (Conta c : contaRepository.findAll()) {
            String pin = c.getPin();
            if (pin != null && !pin.startsWith("$2")) {
                c.setPin(encoder.encode(pin));
                contaRepository.save(c);
                n++;
            }
        }
        if (n > 0) {
            log.warn("{} PIN(s) em texto simples foram cifrados com BCrypt.", n);
        }
    }

    private static String senhaAleatoria(int tamanho) {
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tamanho; i++) {
            sb.append(ALFABETO.charAt(r.nextInt(ALFABETO.length())));
        }
        return sb.toString();
    }
}
