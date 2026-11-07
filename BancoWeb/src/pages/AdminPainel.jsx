import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminApi, TransacoesApi } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Cabecalho, Carga, DetalheTransacao, TabelaTransacoes } from "../components.jsx";
import { useCarregar } from "../hooks.js";
import { moeda } from "../util.js";

export default function AdminPainel() {
  const { tem } = useAuth();
  const [aberta, setAberta] = useState(null);
  const resumo = useCarregar(() => AdminApi.resumo());
  const recentes = useCarregar(() => (tem("TRANSACAO_CONSULTAR") ? TransacoesApi.listar(0, 10) : Promise.resolve([])));

  const r = resumo.dados;

  const atencao = [];
  if (r) {
    if (r.funcionarios === 0) {
      atencao.push({ chave: "sem-func", texto: "Ainda não há funcionários registados.", para: "/funcionarios", acao: "Registar funcionário" });
    }
    if (r.funcionariosBloqueados > 0) {
      atencao.push({
        chave: "func-bloq",
        texto: `${r.funcionariosBloqueados} funcionário(s) com acesso bloqueado.`,
        para: "/funcionarios",
        acao: "Ver funcionários"
      });
    }
    if (r.contasInativas > 0) {
      atencao.push({
        chave: "contas-inat",
        texto: `${r.contasInativas} conta(s) inativa(s). Não recebem depósitos nem transferências.`,
        para: "/contas",
        acao: "Ver contas"
      });
    }
  }

  return (
    <>
      <Cabecalho titulo="Painel de administração" descricao="Situação geral do banco, lida diretamente do servidor." >
        <button type="button" className="btn" onClick={() => { resumo.recarregar(); recentes.recarregar(); }}>Atualizar</button>
      </Cabecalho>

      <Carga {...resumo} aoTentar={resumo.recarregar}>
        {r && (
          <>
            <dl className="resumo">
              <div><dt>Clientes</dt><dd>{r.clientes}</dd></div>
              <div><dt>Contas ativas</dt><dd>{r.contasAtivas}</dd></div>
              <div><dt>Contas inativas</dt><dd>{r.contasInativas}</dd></div>
              <div><dt>Saldo total em contas</dt><dd>{moeda(r.saldoTotal)}</dd></div>
            </dl>
            <dl className="resumo">
              <div><dt>Funcionários</dt><dd>{r.funcionarios}</dd></div>
              <div><dt>Funcionários bloqueados</dt><dd>{r.funcionariosBloqueados}</dd></div>
              <div><dt>Transações no total</dt><dd>{r.transacoes}</dd></div>
              <div><dt>Transações hoje</dt><dd>{r.transacoesHoje}</dd></div>
              <div><dt>Total depositado</dt><dd>{moeda(r.totalDepositado)}</dd></div>
            </dl>

            <section className="seccao">
              <h2>Requer atenção</h2>
              {atencao.length === 0 ? (
                <p className="vazio">Nada pendente.</p>
              ) : (
                <ul className="atencao">
                  {atencao.map((a) => (
                    <li key={a.chave}>
                      <span>{a.texto}</span>
                      <Link className="link" to={a.para}>{a.acao}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </Carga>

      {tem("TRANSACAO_CONSULTAR") && (
        <section className="seccao">
          <div className="seccao-topo">
            <h2>Últimos movimentos</h2>
            <Link className="link" to="/transacoes">Ver o histórico completo</Link>
          </div>
          <Carga {...recentes} aoTentar={recentes.recarregar}>
            <TabelaTransacoes itens={recentes.dados || []} aoAbrir={setAberta} />
          </Carga>
        </section>
      )}

      <DetalheTransacao transacao={aberta} aoFechar={() => setAberta(null)} />
    </>
  );
}
