/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package mz.nunes.banco.service;
import mz.nunes.banco.model.Cliente;
import mz.nunes.banco.repository.ClienteRepository;
import mz.nunes.banco.repository.ContaRepository;
import mz.nunes.banco.exception.ConflitoException;
import mz.nunes.banco.exception.RecursoNaoEncontradoException;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

/**
 *
 * @author indomavel
 */
@Service
public class ClienteService {
    private final ClienteRepository clienteRepository;
    private final ContaRepository contaRepository;

    public ClienteService(ClienteRepository clienteRepository, ContaRepository contaRepository) {
        this.clienteRepository = clienteRepository;
        this.contaRepository = contaRepository;
    }
    public List<Cliente> listarClientes(){
        return clienteRepository.findAll();
    }
    public Cliente buscar(Long id){
        return clienteRepository.findById(id).orElseThrow(()->new RecursoNaoEncontradoException("Cliente não encontrado com ID:"+id));
    }
    @Transactional
    public Cliente criar(Cliente cliente){
        cliente.setId(null);
        return clienteRepository.save(cliente);
    }
    @Transactional
    public Cliente atualizar(Long id, Cliente dados){
        Cliente existente = buscar(id);
        existente.setNome(dados.getNome());
        existente.setBi(dados.getBi());
        existente.setNumero(dados.getNumero());
        existente.setEmail(dados.getEmail());
        existente.setEstado(dados.getEstado());
        return clienteRepository.save(existente);
    }
    @Transactional
    public void deletar(Long id){
        if(!clienteRepository.existsById(id)){
            throw new RecursoNaoEncontradoException("Cliente não encontrado com ID:"+id);
        }
        if(contaRepository.existsByClienteId(id)){
            throw new ConflitoException("O cliente tem contas associadas. Desative as contas em vez de eliminar o cliente.");
        }
        clienteRepository.deleteById(id);
    }
    
}
