const BASE = "http://13.61.19.54:8080";
const CHAVE = "banco.web.sessao";

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}


export function lerSessao() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CHAVE));
    if (s && Date.parse(s.expiraEm) > Date.now()) return s;
  } catch {
   
  }
  sessionStorage.removeItem(CHAVE);
  return null;
}
export const guardarSessao = (s) => sessionStorage.setItem(CHAVE, JSON.stringify(s));
export const limparSessao = () => sessionStorage.removeItem(CHAVE);

let aoExpirar = null;
export const definirAoExpirar = (fn) => {
  aoExpirar = fn;
};

async function pedir(metodo, caminho, { corpo, params } = {}) {
  const sessao = lerSessao();
  const url = new URL(BASE + caminho);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }

  const cabecalhos = { Accept: "application/json" };
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (sessao) cabecalhos.Authorization = `Bearer ${sessao.token}`;

  let res;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined
    });
  } catch {
    throw new ErroApi("Sem ligação ao servidor. Verifique se o backend está a correr.", 0);
  }

  if (res.status === 204) return null;

  let dados = null;
  try {
    dados = await res.json();
  } catch {
    
  }

  if (!res.ok) {
    if (res.status === 401 && !caminho.startsWith("/api/auth/login") && aoExpirar) aoExpirar();
    const padrao =
      res.status === 401 ? "Sessão expirada. Entre novamente."
      : res.status === 403 ? "Não tem permissão para esta operação."
      : `Erro ${res.status} no servidor.`;
    throw new ErroApi(dados?.message || dados?.erro || padrao, res.status);
  }
  return dados;
}

const get = (c, params) => pedir("GET", c, { params });
const post = (c, corpo) => pedir("POST", c, { corpo });
const put = (c, corpo) => pedir("PUT", c, { corpo });
const patch = (c) => pedir("PATCH", c);
const del = (c) => pedir("DELETE", c);

export const AuthApi = {
  entrar: (email, senha) => post("/api/auth/login/funcionario", { email, senha })
};

export const ClientesApi = {
  listar: () => get("/api/clientes"),
  criar: (dados) => post("/api/clientes", dados),
  atualizar: (id, dados) => put(`/api/clientes/${id}`, dados),
  eliminar: (id) => del(`/api/clientes/${id}`)
};

export const ContasApi = {
  listar: () => get("/api/contas"),
  criar: (clienteId, pin) => post("/api/contas", { clienteId, pin }),
  reporPin: (id, novoPin) => put(`/api/contas/${id}`, { novoPin }),
  ativar: (id) => patch(`/api/contas/${id}/ativar`),
  desativar: (id) => patch(`/api/contas/${id}/desativar`),
  eliminar: (id) => del(`/api/contas/${id}`),
  extrato: (id, pagina = 0, tamanho = 30) => get(`/api/contas/${id}/extrato`, { pagina, tamanho })
};

export const TransacoesApi = {
  listar: (pagina = 0, tamanho = 30) => get("/api/transacoes", { pagina, tamanho }),
  buscar: (referencia) => get(`/api/transacoes/${encodeURIComponent(referencia)}`),
  depositar: (dados) => post("/api/transacoes/depositos", dados)
};

export const AdminApi = {
  resumo: () => get("/api/admin/resumo"),
  usuarios: () => get("/api/admin/usuarios"),
  permissoes: () => get("/api/admin/permissoes"),
  definirPermissoes: (id, permissoes) => put(`/api/admin/usuarios/${id}/permissoes`, { permissoes }),
  bloquear: (id) => patch(`/api/admin/usuarios/${id}/bloquear`),
  desbloquear: (id) => patch(`/api/admin/usuarios/${id}/desbloquear`),
  reporSenha: (id, novaSenha) => put(`/api/admin/usuarios/${id}/senha`, { novaSenha }),
  criarFuncionario: (dados) => post("/api/funcionarios", dados),
  atualizarFuncionario: (id, dados) => put(`/api/funcionarios/${id}`, dados),
  eliminarFuncionario: (id) => del(`/api/funcionarios/${id}`)
};
