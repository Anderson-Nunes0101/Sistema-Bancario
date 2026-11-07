import React, { createContext, useContext, useEffect, useState } from "react";

import { AuthAPI, registarSessaoExpirada } from "../services/api";
import { guardarSessao, lerSessao, limparSessao } from "../services/sessao";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [sessao, setSessao] = useState(null);
    const [carregando, setCarregando] = useState(true);

    async function sair() {
        await limparSessao();
        setSessao(null);
    }

    useEffect(() => {
        registarSessaoExpirada(sair);
        lerSessao().then((s) => {
            setSessao(s);
            setCarregando(false);
        });
    }, []);

    async function entrarCliente(numeroConta, pin) {
        const res = await AuthAPI.loginCliente(numeroConta.trim(), pin);
        await guardarSessao(res.data);
        setSessao(res.data);
    }

    async function entrarFuncionario(email, senha) {
        const res = await AuthAPI.loginFuncionario(email.trim(), senha);
        await guardarSessao(res.data);
        setSessao(res.data);
    }

    const tem = (permissao) => !!sessao?.permissoes?.includes(permissao);

    return (
        <AuthContext.Provider
            value={{ sessao, carregando, entrarCliente, entrarFuncionario, sair, tem }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
