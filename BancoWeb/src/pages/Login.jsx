import { useState } from "react";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aEntrar, setAEntrar] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Indique o email e a senha.");
      return;
    }
    setAEntrar(true);
    try {
      await entrar(email, senha);
    } catch (e2) {
      setErro(e2.message);
      setSenha("");
    } finally {
      setAEntrar(false);
    }
  }

  return (
    <div className="login">
      <section className="login-painel">
        <p className="login-marca">Banco</p>
        <h1>Entrar no back-office</h1>
        <p className="suave">
          Acesso para funcionários e administradores. Os clientes entram pela aplicação móvel com o número da conta e o PIN.
        </p>

        <form className="form" onSubmit={enviar}>
          <label className="campo">
            <span>Email</span>
            <input type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="campo">
            <span>Senha</span>
            <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
          {erro && <p className="erro-form" role="alert">{erro}</p>}
          <button className="btn primario largo" disabled={aEntrar}>{aEntrar ? "A entrar…" : "Entrar"}</button>
        </form>
      </section>
    </div>
  );
}
