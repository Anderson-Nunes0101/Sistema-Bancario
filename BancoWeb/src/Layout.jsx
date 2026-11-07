import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { PERFIL } from "./util.js";

const OPERACAO = [
  { para: "/", rotulo: "Início", fim: true },
  { para: "/clientes", rotulo: "Clientes", perm: ["CLIENTE_CONSULTAR"] },
  { para: "/contas", rotulo: "Contas", perm: ["CONTA_CONSULTAR"] },
  { para: "/transacoes", rotulo: "Depósitos e histórico", perm: ["TRANSACAO_CONSULTAR", "DEPOSITO_REALIZAR"] }
];

const ADMINISTRACAO = [
  { para: "/admin", rotulo: "Painel de administração", perm: ["SISTEMA_GERIR"] },
  { para: "/funcionarios", rotulo: "Funcionários e acessos", perm: ["FUNCIONARIO_CONSULTAR"] }
];

export default function Layout() {
  const { sessao, sair, temAlguma } = useAuth();

  const visiveis = (lista) => lista.filter((i) => !i.perm || temAlguma(...i.perm));
  const op = visiveis(OPERACAO);
  const adm = visiveis(ADMINISTRACAO);

  const link = (i) => (
    <NavLink key={i.para} to={i.para} end={i.fim} className={({ isActive }) => "nav-item" + (isActive ? " ativo" : "")}>
      {i.rotulo}
    </NavLink>
  );

  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <strong>Banco</strong>
          <span>Back-office</span>
        </div>

        <nav aria-label="Principal">
          <p className="nav-grupo">Operação</p>
          {op.map(link)}
          {adm.length > 0 && <p className="nav-grupo">Administração</p>}
          {adm.map(link)}
        </nav>

        <div className="utilizador">
          <div>
            <strong>{sessao.nome}</strong>
            <span>{PERFIL[sessao.tipo] || sessao.tipo}</span>
          </div>
          <button type="button" className="btn claro" onClick={sair}>Terminar sessão</button>
        </div>
      </aside>

      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
