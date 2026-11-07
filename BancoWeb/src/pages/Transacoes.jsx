import { useEffect, useState } from "react";
import { TransacoesApi } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Cabecalho, DetalheTransacao, FormDeposito, TabelaTransacoes } from "../components.jsx";

const TAMANHO = 30;

export default function Transacoes() {
  const { tem } = useAuth();
  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState(null);
  const [ref, setRef] = useState("");
  const [erroRef, setErroRef] = useState("");

  const podeVer = tem("TRANSACAO_CONSULTAR");

  async function carregar(p) {
    setACarregar(true);
    setErro("");
    try {
      const r = await TransacoesApi.listar(p, TAMANHO);
      setItens((atual) => (p === 0 ? r : [...atual, ...r]));
      setPagina(p);
      setTemMais(r.length === TAMANHO);
    } catch (e) {
      setErro(e.message);
    } finally {
      setACarregar(false);
    }
  }

  useEffect(() => {
    if (podeVer) carregar(0);
    
  }, [podeVer]);

  async function procurar(e) {
    e.preventDefault();
    setErroRef("");
    if (!ref.trim()) return;
    try {
      setAberta(await TransacoesApi.buscar(ref.trim()));
    } catch (e2) {
      setErroRef(e2.message);
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Depósitos e histórico"
        descricao="O histórico é um registo permanente: as transações não se alteram nem se apagam."
      />

      {tem("DEPOSITO_REALIZAR") && (
        <section className="seccao estreita">
          <h2>Novo depósito</h2>
          <FormDeposito aoConcluir={() => podeVer && carregar(0)} />
        </section>
      )}

      {podeVer && (
        <section className="seccao">
          <div className="seccao-topo">
            <h2>Histórico de transações</h2>
            <form className="ferramentas" onSubmit={procurar}>
              <input
                placeholder="Procurar por referência"
                aria-label="Referência da transação"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
              <button className="btn">Procurar</button>
              <button type="button" className="btn" onClick={() => carregar(0)}>Atualizar</button>
            </form>
          </div>
          {erroRef && <p className="erro-form" role="alert">{erroRef}</p>}
          {erro && <p className="erro-form" role="alert">{erro}</p>}

          <TabelaTransacoes itens={itens} aoAbrir={setAberta} />
          {aCarregar && <p className="suave">A carregar…</p>}
          {temMais && !aCarregar && (
            <button type="button" className="btn" onClick={() => carregar(pagina + 1)}>Carregar transações mais antigas</button>
          )}
        </section>
      )}

      <DetalheTransacao transacao={aberta} aoFechar={() => setAberta(null)} />
    </>
  );
}
