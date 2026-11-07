import axios from "axios";
import { tokenAtual } from "./sessao";

const API_URL = "http://192.168.43.70:8080";

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
});

// Callback registado pelo AuthContext para terminar a sessão quando o token expira/é recusado
let aoExpirarSessao = null;
export function registarSessaoExpirada(fn) {
    aoExpirarSessao = fn;
}

api.interceptors.request.use((config) => {
    const token = tokenAtual();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (erro) => {
        const url = erro.config?.url || "";
        const eLogin = url.includes("/api/auth/login");
        if (erro.response?.status === 401 && !eLogin && aoExpirarSessao) {
            aoExpirarSessao();
        }
        return Promise.reject(erro);
    }
);

export function mensagemErro(e) {
    if (!e.response) return "Sem ligação ao servidor. Verifique a rede.";
    return e.response.data?.message || e.response.data?.erro || e.message;
}

// AUTENTICAÇÃO
export const AuthAPI = {
    loginCliente: (numeroConta, pin) =>
        api.post("/api/auth/login/cliente", { numeroConta, pin }),
    loginFuncionario: (email, senha) =>
        api.post("/api/auth/login/funcionario", { email, senha })
};

// FUNCIONÁRIO: CLIENTES
export const ClienteAPI = {
    listar: () => api.get("/api/clientes"),
    buscar: (id) => api.get(`/api/clientes/${id}`),
    criar: (dados) => api.post("/api/clientes", dados),
    atualizar: (id, dados) => api.put(`/api/clientes/${id}`, dados),
    eliminar: (id) => api.delete(`/api/clientes/${id}`)
};

// FUNCIONÁRIO: CONTAS
export const ContaAPI = {
    listar: () => api.get("/api/contas"),
    buscar: (id) => api.get(`/api/contas/${id}`),
    criar: (clienteId, pin) => api.post("/api/contas", { clienteId, pin }),
    reporPin: (id, novoPin) => api.put(`/api/contas/${id}`, { novoPin }),
    ativar: (id) => api.patch(`/api/contas/${id}/ativar`),
    desativar: (id) => api.patch(`/api/contas/${id}/desativar`),
    eliminar: (id) => api.delete(`/api/contas/${id}`)
};

// FUNCIONÁRIO: TRANSAÇÕES (histórico imutável + depósitos)
export const TransacaoAPI = {
    listar: (pagina = 0, tamanho = 30) =>
        api.get("/api/transacoes", { params: { pagina, tamanho } }),
    depositar: (dados) => api.post("/api/transacoes/depositos", dados)
};

// CLIENTE: A SUA CONTA
export const MinhaContaAPI = {
    conta: () => api.get("/api/minha-conta"),
    extrato: (pagina = 0, tamanho = 30) =>
        api.get("/api/minha-conta/extrato", { params: { pagina, tamanho } }),
    transferir: (dados) => api.post("/api/minha-conta/transferencias", dados),
    alterarPin: (pinAtual, novoPin) =>
        api.put("/api/minha-conta/pin", { pinAtual, novoPin })
};

export default api;
