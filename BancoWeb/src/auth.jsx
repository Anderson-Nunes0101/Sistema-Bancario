import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthApi, definirAoExpirar, guardarSessao, lerSessao, limparSessao } from "./api.js";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => lerSessao());

  const sair = useCallback(() => {
    limparSessao();
    setSessao(null);
  }, []);

  useEffect(() => {
    definirAoExpirar(sair);
  }, [sair]);

  // termina a sessão quando o token expira
  useEffect(() => {
    if (!sessao) return undefined;
    const ms = Math.max(Date.parse(sessao.expiraEm) - Date.now(), 0);
    const t = setTimeout(sair, ms);
    return () => clearTimeout(t);
  }, [sessao, sair]);

  async function entrar(email, senha) {
    const s = await AuthApi.entrar(email.trim(), senha);
    guardarSessao(s);
    setSessao(s);
  }

  const tem = (p) => !!sessao?.permissoes?.includes(p);
  const temAlguma = (...ps) => ps.some(tem);

  return (
    <Ctx.Provider value={{ sessao, entrar, sair, tem, temAlguma }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
