package mz.nunes.banco.model;

public enum Permissao {

    // Gestão de clientes (funcionário)
    CLIENTE_CRIAR,
    CLIENTE_CONSULTAR,
    CLIENTE_ATUALIZAR,
    CLIENTE_ELIMINAR,
    CLIENTE_BLOQUEAR,
    CLIENTE_DESBLOQUEAR,

    // Gestão de contas (funcionário)
    CONTA_CRIAR,
    CONTA_CONSULTAR,
    CONTA_ATUALIZAR,
    CONTA_ELIMINAR,
    CONTA_BLOQUEAR,      // desativar conta
    CONTA_DESBLOQUEAR,   // ativar conta

    // Operações financeiras
    DEPOSITO_REALIZAR,        // funcionário
    TRANSFERENCIA_REALIZAR,   // cliente (a partir da própria conta)
    TRANSACAO_CONSULTAR,      // funcionário: histórico geral
    EXTRATO_CONSULTAR,        // funcionário: extrato de qualquer conta

    // Área do cliente (apenas a própria conta)
    MINHA_CONTA_CONSULTAR,
    MINHA_CONTA_EXTRATO,
    MINHA_CONTA_ALTERAR_PIN,

    // Gestão de funcionários e utilizadores
    FUNCIONARIO_CRIAR,
    FUNCIONARIO_CONSULTAR,
    FUNCIONARIO_ATUALIZAR,
    FUNCIONARIO_ELIMINAR,
    FUNCIONARIO_BLOQUEAR,
    FUNCIONARIO_DESBLOQUEAR,
    PERMISSAO_GERIR,

    // Administração geral
    SISTEMA_GERIR
}
