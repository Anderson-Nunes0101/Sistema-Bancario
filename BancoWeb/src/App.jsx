import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Layout from "./Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Contas from "./pages/Contas.jsx";
import Transacoes from "./pages/Transacoes.jsx";
import Funcionarios from "./pages/Funcionarios.jsx";
import AdminPainel from "./pages/AdminPainel.jsx";

function Exige({ perm, children }) {
  const { temAlguma } = useAuth();
  if (!temAlguma(...perm)) {
    return (
      <div className="bloco-erro">
        <h1>Sem acesso</h1>
        <p>A sua conta não tem permissão para esta área. Peça ao administrador para a ativar.</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  const { sessao } = useAuth();
  if (!sessao) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Exige perm={["CLIENTE_CONSULTAR"]}><Clientes /></Exige>} />
        <Route path="contas" element={<Exige perm={["CONTA_CONSULTAR"]}><Contas /></Exige>} />
        <Route
          path="transacoes"
          element={<Exige perm={["TRANSACAO_CONSULTAR", "DEPOSITO_REALIZAR"]}><Transacoes /></Exige>}
        />
        <Route path="funcionarios" element={<Exige perm={["FUNCIONARIO_CONSULTAR"]}><Funcionarios /></Exige>} />
        <Route path="admin" element={<Exige perm={["SISTEMA_GERIR"]}><AdminPainel /></Exige>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
