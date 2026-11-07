export function moeda(v) {
  const n = Number(v ?? 0);
  const [inteiro, decimais] = Math.abs(n).toFixed(2).split(".");
  return (n < 0 ? "-" : "") + inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "," + decimais + "\u00a0MT";
}

// "2026-11-05T15:54:12.123" -> "05/11/2026 15:54"
export function dataHora(iso) {
  if (!iso) return "";
  const s = String(iso);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)}`;
}

export const soDigitos = (t) => t.replace(/\D/g, "");

// Aceita "10,5" ou "10.50"; devolve número ou null (máx. 2 casas decimais, > 0)
export function lerValor(texto) {
  const t = String(texto).trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 ? n : null;
}

export const ROTULOS = {
  CLIENTE_CRIAR: "Registar clientes",
  CLIENTE_CONSULTAR: "Ver clientes",
  CLIENTE_ATUALIZAR: "Editar clientes",
  CLIENTE_ELIMINAR: "Eliminar clientes",
  CONTA_CRIAR: "Abrir contas",
  CONTA_CONSULTAR: "Ver contas",
  CONTA_ATUALIZAR: "Repor o PIN de contas",
  CONTA_ELIMINAR: "Eliminar contas",
  CONTA_BLOQUEAR: "Desativar contas",
  CONTA_DESBLOQUEAR: "Ativar contas",
  DEPOSITO_REALIZAR: "Fazer depósitos",
  TRANSACAO_CONSULTAR: "Ver o histórico de transações",
  EXTRATO_CONSULTAR: "Ver o extrato de contas",
  FUNCIONARIO_CRIAR: "Registar funcionários",
  FUNCIONARIO_CONSULTAR: "Ver funcionários",
  FUNCIONARIO_ATUALIZAR: "Editar funcionários",
  FUNCIONARIO_ELIMINAR: "Eliminar funcionários",
  FUNCIONARIO_BLOQUEAR: "Bloquear funcionários",
  FUNCIONARIO_DESBLOQUEAR: "Desbloquear funcionários",
  PERMISSAO_GERIR: "Gerir permissões e senhas",
  SISTEMA_GERIR: "Ver o painel de administração"
};

export const GRUPOS = [
  { titulo: "Clientes", chaves: ["CLIENTE_CONSULTAR", "CLIENTE_CRIAR", "CLIENTE_ATUALIZAR", "CLIENTE_ELIMINAR"] },
  {
    titulo: "Contas",
    chaves: ["CONTA_CONSULTAR", "CONTA_CRIAR", "CONTA_ATUALIZAR", "CONTA_BLOQUEAR", "CONTA_DESBLOQUEAR", "CONTA_ELIMINAR"]
  },
  { titulo: "Movimentos", chaves: ["DEPOSITO_REALIZAR", "TRANSACAO_CONSULTAR", "EXTRATO_CONSULTAR"] },
  {
    titulo: "Funcionários",
    chaves: [
      "FUNCIONARIO_CONSULTAR", "FUNCIONARIO_CRIAR", "FUNCIONARIO_ATUALIZAR",
      "FUNCIONARIO_BLOQUEAR", "FUNCIONARIO_DESBLOQUEAR", "FUNCIONARIO_ELIMINAR"
    ]
  },
  { titulo: "Administração", chaves: ["PERMISSAO_GERIR", "SISTEMA_GERIR"] }
];

// Pacote que o backend aplica por omissão a um novo funcionário
export const PACOTE_PADRAO = [
  "CLIENTE_CRIAR", "CLIENTE_CONSULTAR", "CLIENTE_ATUALIZAR", "CLIENTE_ELIMINAR",
  "CONTA_CRIAR", "CONTA_CONSULTAR", "CONTA_ATUALIZAR", "CONTA_ELIMINAR", "CONTA_BLOQUEAR", "CONTA_DESBLOQUEAR",
  "DEPOSITO_REALIZAR", "TRANSACAO_CONSULTAR", "EXTRATO_CONSULTAR"
];

export const PERFIL = { ADMIN: "Administrador", FUNCIONARIO: "Funcionário" };
