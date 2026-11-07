import { useEffect, useState } from "react";
import { ContasApi } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useAvisos } from "../avisos.jsx";
import { Cabecalho, Carga, CampoPin, Estado, FormDeposito, Modal, Vazio, useConfirmar } from "../components.jsx";
import { useCarregar } from "../hooks.js";
import { dataHora, moeda } from "../util.js";

export default function Contas() {
  const { tem } = useAuth();
  const { avisar } = useAvisos();
  const { confirmar, dialogo } = useConfirmar();
  const { dados, erro, aCarregar, recarregar } = useCarregar(() => ContasApi.listar());

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [extrato, setExtrato] = useState(null);
  const [deposito, setDeposito] = useState(null);
  const [pinConta, setPinConta] = useState(null);

  const todas = dados || [];
  const ativas = todas.filter((c) => c.estado === "ATIVA").length;
  const saldo = todas.reduce((s, c) => s + Number(c.saldo), 0);

  const lista = todas.filter(
    (c) =>
      (filtro === "TODAS" || c.estado === filtro) &&
      [c.numeroConta, c.clienteNome].join(" ").toLowerCase().includes(busca.trim().toLowerCase())
  );

  async function alterarEstado(c) {
    try {
      if (c.estado === "ATIVA") await ContasApi.desativar(c.id);
      else await ContasApi.ativar(c.id);
      avisar(`Conta ${c.numeroConta} ${c.estado === "ATIVA" ? "desativada" : "ativada"}.`);
      recarregar();
    } catch (e) {
      avisar(e.message, "erro");
    }
  }

  function desativar(c) {
    confirmar(
      `Desativar a conta ${c.numeroConta}? Enquanto estiver inativa não recebe depósitos nem transferências e o cliente não consegue entrar.`,
      () => alterarEstado(c),
      "Desativar conta"
    );
  }

  function eliminar(c) {
    confirmar(
      `Eliminar a conta ${c.numeroConta}? Só é possível se não tiver saldo nem movimentos.`,
      async () => {
        try {
          await ContasApi.eliminar(c.id);
          avisar("Conta eliminada.");
          recarregar();
        } catch (e) {
          avisar(e.message, "erro");
        }
      },
      "Eliminar conta"
    );
  }

  return (
    <>
      <Cabecalho titulo="Contas" descricao="Ative ou desative contas, faça depósitos e consulte extratos." />

      <dl className="resumo">
        <div><dt>Contas</dt><dd>{todas.length}</dd></div>
        <div><dt>Ativas</dt><dd>{ativas}</dd></div>
        <div><dt>Inativas</dt><dd>{todas.length - ativas}</dd></div>
        <div><dt>Saldo total</dt><dd>{moeda(saldo)}</dd></div>
      </dl>

      <div className="ferramentas">
        <input
          type="search"
          placeholder="Procurar por número da conta ou titular"
          aria-label="Procurar contas"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select aria-label="Filtrar por estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="TODAS">Todas</option>
          <option value="ATIVA">Ativas</option>
          <option value="INATIVA">Inativas</option>
        </select>
      </div>

      <Carga aCarregar={aCarregar} erro={erro} dados={dados} aoTentar={recarregar}>
        {lista.length === 0 ? (
          <Vazio>{todas.length ? "Nenhuma conta corresponde à procura." : "Ainda não há contas. Abra uma a partir de um cliente."}</Vazio>
        ) : (
          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Conta</th><th>Titular</th><th className="num">Saldo</th><th>Estado</th><th>Aberta em</th>
                  <th><span className="so-leitor">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.numeroConta}</td>
                    <td>{c.clienteNome}</td>
                    <td className="num">{moeda(c.saldo)}</td>
                    <td><Estado ativo={c.estado === "ATIVA"} /></td>
                    <td>{dataHora(c.dataAbertura)}</td>
                    <td className="acoes-linha">
                      {tem("EXTRATO_CONSULTAR") && <button type="button" className="link" onClick={() => setExtrato(c)}>Extrato</button>}
                      {tem("DEPOSITO_REALIZAR") && c.estado === "ATIVA" && (
                        <button type="button" className="link" onClick={() => setDeposito(c)}>Depositar</button>
                      )}
                      {c.estado === "ATIVA"
                        ? tem("CONTA_BLOQUEAR") && <button type="button" className="link perigo" onClick={() => desativar(c)}>Desativar</button>
                        : tem("CONTA_DESBLOQUEAR") && <button type="button" className="link" onClick={() => alterarEstado(c)}>Ativar</button>}
                      {tem("CONTA_ATUALIZAR") && <button type="button" className="link" onClick={() => setPinConta(c)}>Repor PIN</button>}
                      {tem("CONTA_ELIMINAR") && <button type="button" className="link perigo" onClick={() => eliminar(c)}>Eliminar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carga>

      <Modal aberto={!!extrato} aoFechar={() => setExtrato(null)} titulo={`Extrato da conta ${extrato?.numeroConta}`} largo>
        {extrato && <Extrato conta={extrato} />}
      </Modal>

      <Modal aberto={!!deposito} aoFechar={() => setDeposito(null)} titulo="Depositar">
        {deposito && (
          <>
            <p>Titular: <strong>{deposito.clienteNome}</strong></p>
            <FormDeposito contaInicial={deposito.numeroConta} aoConcluir={() => { setDeposito(null); recarregar(); }} />
          </>
        )}
      </Modal>

      <Modal aberto={!!pinConta} aoFechar={() => setPinConta(null)} titulo="Repor PIN">
        {pinConta && <FormPin conta={pinConta} aoConcluir={() => setPinConta(null)} />}
      </Modal>

      {dialogo}
    </>
  );
}

const TAMANHO = 30;

/** Extrato em formato de caderneta: débito, crédito e saldo corrido. */
function Extrato({ conta }) {
  const [itens, setItens] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [erro, setErro] = useState("");
  const [aCarregar, setACarregar] = useState(true);

  async function carregar(p) {
    setACarregar(true);
    setErro("");
    try {
      const r = await ContasApi.extrato(conta.id, p, TAMANHO);
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
    carregar(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conta.id]);

  const operacao = (i) =>
    i.tipo === "DEPOSITO" ? "Depósito" : i.sentido === "CREDITO" ? "Transferência recebida" : "Transferência enviada";

  return (
    <div>
      <p>
        Titular: <strong>{conta.clienteNome}</strong>. Saldo atual: <strong>{moeda(conta.saldo)}</strong>.
      </p>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      {!aCarregar && !erro && itens.length === 0 ? (
        <Vazio>Esta conta ainda não tem movimentos.</Vazio>
      ) : (
        <div className="tabela-caixa caderneta">
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th><th>Operação</th><th>Conta</th>
                <th className="num">Débito</th><th className="num">Crédito</th><th className="num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => {
                const credito = i.sentido === "CREDITO";
                return (
                  <tr key={i.referencia}>
                    <td>{dataHora(i.dataHora)}</td>
                    <td>
                      {operacao(i)}
                      {i.descricao && <span className="nota">{i.descricao}</span>}
                    </td>
                    <td className="mono">{i.contraparte || "—"}</td>
                    <td className="num debito">{!credito ? moeda(i.valor) : ""}</td>
                    <td className="num credito">{credito ? moeda(i.valor) : ""}</td>
                    <td className="num">{i.saldoApos != null ? moeda(i.saldoApos) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {aCarregar && <p className="suave">A carregar…</p>}
      {temMais && !aCarregar && (
        <button type="button" className="btn" onClick={() => carregar(pagina + 1)}>Carregar movimentos mais antigos</button>
      )}
    </div>
  );
}

function FormPin({ conta, aoConcluir }) {
  const { avisar } = useAvisos();
  const [pin, setPin] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setErro("");
    if (pin.length !== 4) return setErro("O PIN deve ter exatamente 4 dígitos.");
    if (pin !== confirma) return setErro("A confirmação do PIN não coincide.");
    setAGuardar(true);
    try {
      await ContasApi.reporPin(conta.id, pin);
      avisar(`PIN da conta ${conta.numeroConta} reposto. Também levanta qualquer bloqueio por tentativas falhadas.`);
      aoConcluir();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form className="form" onSubmit={guardar}>
      <p>Novo PIN para a conta <strong>{conta.numeroConta}</strong> de {conta.clienteNome}.</p>
      <CampoPin rotulo="Novo PIN" valor={pin} aoMudar={setPin} autoFocus />
      <CampoPin rotulo="Confirmar novo PIN" valor={confirma} aoMudar={setConfirma} />
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button className="btn primario" disabled={aGuardar}>Repor PIN</button>
      </div>
    </form>
  );
}
