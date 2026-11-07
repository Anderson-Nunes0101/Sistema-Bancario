package mz.nunes.banco.controller;

import jakarta.validation.Valid;
import mz.nunes.banco.dto.Dtos.LoginClienteRequest;
import mz.nunes.banco.dto.Dtos.LoginFuncionarioRequest;
import mz.nunes.banco.dto.Dtos.LoginResponse;
import mz.nunes.banco.service.AuthService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

   
    @PostMapping("/login/funcionario")
    public LoginResponse loginFuncionario(@Valid @RequestBody LoginFuncionarioRequest r) {
        return service.loginFuncionario(r.email(), r.senha());
    }

    
    @PostMapping("/login/cliente")
    public LoginResponse loginCliente(@Valid @RequestBody LoginClienteRequest r) {
        return service.loginCliente(r.numeroConta(), r.pin());
    }
}
