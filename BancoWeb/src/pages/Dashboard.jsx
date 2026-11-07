import { useState } from "react";
import { ClientesApi, ContasApi, TransacoesApi } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Cabecalho, Carga, DetalheTransacao, TabelaTransacoes } from "../components.jsx";
import { useCarregar } from "../hooks.js";
import { GRUPOS, ROTULOS, moeda } from "../util.js";

export default function Dashboard() {
  const { sessao, tem } = useAuth();
  const [aberta, setAberta] = useState(null);

  const verTransacoes = tem("TRANSACAO_CONSULTAR");
  const verContas = tem("CONTA_CONSULTAR");
  const verClientes = tem("CLIENTE_CONSULTAR");

  const recentes = useCarregar(() => (verTransacoes ? TransacoesApi.listar(0, 8) : Promise.resolve([])));
  const contas = useCarregar(() => (verContas ? ContasApi.listar() : Promise.resolve([])));
  const clientes = useCarregar(() => (verClientes ? ClientesApi.listar() : Promise.resolve([])));

  const lista = contas.dados || [];
  const ativas = lista.filter((c) => c.estado === "ATIVA").length;
  const saldo = lista.reduce((s, c) => s + Number(c.saldo), 0);
  const primeiroNome = sessao.nome.split(" ")[0];

  const meusGrupos = GRUPOS.map((g) => ({
    ...g,
    chaves: g.chaves.filter((k) => tem(k))
  })).filter((g) => g.chaves.length > 0);

  return (
    <>
      <Cabecalho titulo={`Olá, ${primeiroNome}`} descricao="Resumo do que pode consultar e fazer com a sua conta." />

      {(verClientes || verContas) && (
        <dl className="resumo">
          {verClientes && (
            <div><dt>Clientes</dt><dd>{clientes.dados ? clientes.dados.length : "…"}</dd></div>
          )}
          {verContas && (
            <>
              <div><dt>Contas ativas</dt><dd>{contas.dados ? ativas : "…"}</dd></div>
              <div><dt>Contas inativas</dt><dd>{contas.dados ? lista.length - ativas : "…"}</dd></div>
              <div><dt>Saldo total</dt><dd>{contas.dados ? moeda(saldo) : "…"}</dd></div>
            </>
          )}
        </dl>
      )}

      {verTransacoes && (
        <section className="seccao">
          <h2>Últimos movimentos</h2>
          <Carga {...recentes} aoTentar={recentes.recarregar}>
            <TabelaTransacoes itens={recentes.dados || []} aoAbrir={setAberta} />
          </Carga>
        </section>
      )}

      <section className="seccao">
        <h2>As suas permissões</h2>
        {meusGrupos.length === 0 ? (
          <p className="vazio">Ainda não tem permissões. Peça ao administrador para as atribuir.</p>
        ) : (
          <div className="grupos-perm">
            {meusGrupos.map((g) => (
              <div key={g.titulo}>
                <h3>{g.titulo}</h3>
                <ul>
                  {g.chaves.map((k) => <li key={k}>{ROTULOS[k]}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <DetalheTransacao transacao={aberta} aoFechar={() => setAberta(null)} />
    </>
  );
}
