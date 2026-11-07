import { useEffect, useRef, useState } from "react";
import { TransacoesApi } from "./api.js";
import { useAvisos } from "./avisos.jsx";
import { dataHora, lerValor, moeda, soDigitos } from "./util.js";

export function Cabecalho({ titulo, descricao, children }) {
  return (
    <header className="cabecalho">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p className="suave">{descricao}</p>}
      </div>
      {children && <div className="cabecalho-acoes">{children}</div>}
    </header>
  );
}

export function Modal({ aberto, aoFechar, titulo, largo, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className={"modal" + (largo ? " largo" : "")}
      onClose={aoFechar}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar();
      }}
    >
      {aberto && (
        <div className="modal-corpo">
          <header className="modal-topo">
            <h2>{titulo}</h2>
            <button type="button" className="icone" aria-label="Fechar" onClick={aoFechar}>×</button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function useConfirmar() {
  const [pedido, setPedido] = useState(null);
  const confirmar = (texto, acao, rotulo = "Confirmar") => setPedido({ texto, acao, rotulo });
  const fechar = () => setPedido(null);

  const dialogo = (
    <Modal aberto={!!pedido} aoFechar={fechar} titulo="Confirmar ação">
      <p>{pedido?.texto}</p>
      <div className="acoes-form">
        <button type="button" className="btn" onClick={fechar}>Cancelar</button>
        <button
          type="button"
          className="btn perigo"
          onClick={async () => {
            const acao = pedido.acao;
            fechar();
            await acao();
          }}
        >
          {pedido?.rotulo}
        </button>
      </div>
    </Modal>
  );
  return { confirmar, dialogo };
}

/** Mostra "a carregar" / erro com botão de repetir, ou o conteúdo. */
export function Carga({ aCarregar, erro, dados, aoTentar, children }) {
  if (erro) {
    return (
      <div className="bloco-erro" role="alert">
        <p>{erro}</p>
        <button type="button" className="btn" onClick={aoTentar}>Tentar de novo</button>
      </div>
    );
  }
  if (aCarregar && !dados) return <p className="suave">A carregar…</p>;
  return children;
}

export function Vazio({ children }) {
  return <p className="vazio">{children}</p>;
}

export function Estado({ ativo, ativoRotulo = "Ativa", inativoRotulo = "Inativa" }) {
  return <span className={"estado " + (ativo ? "ativo" : "inativo")}>{ativo ? ativoRotulo : inativoRotulo}</span>;
}

export function CampoPin({ rotulo, valor, aoMudar, autoFocus }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={valor}
        autoFocus={autoFocus}
        onChange={(e) => aoMudar(soDigitos(e.target.value))}
      />
    </label>
  );
}

const TIPOS = { DEPOSITO: "Depósito", TRANSFERENCIA: "Transferência" };

export function TabelaTransacoes({ itens, aoAbrir }) {
  if (!itens.length) return <Vazio>Ainda não há transações registadas.</Vazio>;
  return (
    <div className="tabela-caixa">
      <table className="tabela">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Origem</th>
            <th>Destino</th>
            <th className="num">Valor</th>
            <th>Executado por</th>
            <th><span className="so-leitor">Detalhe</span></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((t) => (
            <tr key={t.referencia}>
              <td>{dataHora(t.dataHora)}</td>
              <td>{TIPOS[t.tipo] || t.tipo}</td>
              <td>{t.contaOrigem || "Balcão"}</td>
              <td>{t.contaDestino}</td>
              <td className="num">{moeda(t.valor)}</td>
              <td>{t.executadoPor || "—"}</td>
              <td>
                <button type="button" className="link" onClick={() => aoAbrir(t)}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetalheTransacao({ transacao, aoFechar }) {
  const t = transacao;
  return (
    <Modal aberto={!!t} aoFechar={aoFechar} titulo="Detalhe da transação">
      {t && (
        <dl className="ficha">
          <dt>Referência</dt><dd className="mono">{t.referencia}</dd>
          <dt>Tipo</dt><dd>{TIPOS[t.tipo] || t.tipo}</dd>
          <dt>Data</dt><dd>{dataHora(t.dataHora)}</dd>
          <dt>Valor</dt><dd>{moeda(t.valor)}</dd>
          <dt>Conta de origem</dt><dd>{t.contaOrigem || "Balcão (depósito)"}</dd>
          <dt>Saldo da origem depois</dt><dd>{t.saldoOrigemApos != null ? moeda(t.saldoOrigemApos) : "—"}</dd>
          <dt>Conta de destino</dt><dd>{t.contaDestino}</dd>
          <dt>Saldo do destino depois</dt><dd>{t.saldoDestinoApos != null ? moeda(t.saldoDestinoApos) : "—"}</dd>
          <dt>Executado por</dt><dd>{t.executadoPor || "—"}</dd>
          <dt>Descrição</dt><dd>{t.descricao || "—"}</dd>
          <dt>Estado</dt><dd>{t.estado}</dd>
        </dl>
      )}
    </Modal>
  );
}

export function FormDeposito({ contaInicial = "", aoConcluir }) {
  const { avisar } = useAvisos();
  const [conta, setConta] = useState(contaInicial);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    const v = lerValor(valor);
    if (!conta || v === null) {
      setErro("Indique o número da conta e um valor válido (até 2 casas decimais).");
      return;
    }
    setAEnviar(true);
    try {
      const r = await TransacoesApi.depositar({
        contaDestino: conta,
        valor: v,
        descricao: descricao.trim() || null
      });
      avisar(`Depósito de ${moeda(r.valor)} feito na conta ${r.contaDestino}. Novo saldo: ${moeda(r.saldoDestinoApos)}.`);
      setValor("");
      setDescricao("");
      if (!contaInicial) setConta("");
      aoConcluir?.(r);
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form className="form" onSubmit={enviar}>
      <label className="campo">
        <span>Conta de destino</span>
        <input
          inputMode="numeric"
          value={conta}
          readOnly={!!contaInicial}
          onChange={(e) => setConta(soDigitos(e.target.value))}
        />
      </label>
      <label className="campo">
        <span>Valor (MT)</span>
        <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
      </label>
      <label className="campo">
        <span>Descrição (opcional)</span>
        <input maxLength={140} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button className="btn primario" disabled={aEnviar}>
          {aEnviar ? "A depositar…" : "Depositar"}
        </button>
      </div>
    </form>
  );
}
