import { useState } from "react";
import { ClientesApi, ContasApi } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useAvisos } from "../avisos.jsx";
import { Cabecalho, Carga, CampoPin, Modal, Vazio, useConfirmar } from "../components.jsx";
import { useCarregar } from "../hooks.js";

const VAZIO = { nome: "", bi: "", numero: "", email: "" };

export default function Clientes() {
  const { tem } = useAuth();
  const { avisar } = useAvisos();
  const { confirmar, dialogo } = useConfirmar();
  const { dados, erro, aCarregar, recarregar } = useCarregar(() => ClientesApi.listar());

  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(null); 
  const [contaDe, setContaDe] = useState(null); 

  const lista = (dados || []).filter((c) =>
    [c.nome, c.bi, c.numero, c.email].join(" ").toLowerCase().includes(busca.trim().toLowerCase())
  );

  function eliminar(c) {
    confirmar(
      `Eliminar o cliente ${c.nome}? Só é possível se não tiver contas.`,
      async () => {
        try {
          await ClientesApi.eliminar(c.id);
          avisar("Cliente eliminado.");
          recarregar();
        } catch (e) {
          avisar(e.message, "erro");
        }
      },
      "Eliminar cliente"
    );
  }

  return (
    <>
      <Cabecalho titulo="Clientes" descricao="Registe clientes e abra as suas contas.">
        {tem("CLIENTE_CRIAR") && (
          <button type="button" className="btn primario" onClick={() => setForm({ ...VAZIO })}>Novo cliente</button>
        )}
      </Cabecalho>

      <div className="ferramentas">
        <input
          type="search"
          placeholder="Procurar por nome, BI, telefone ou email"
          aria-label="Procurar clientes"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <Carga aCarregar={aCarregar} erro={erro} dados={dados} aoTentar={recarregar}>
        {lista.length === 0 ? (
          <Vazio>{dados?.length ? "Nenhum cliente corresponde à procura." : "Ainda não há clientes. Registe o primeiro."}</Vazio>
        ) : (
          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th><th>BI</th><th>Telefone</th><th>Email</th><th>Estado</th><th><span className="so-leitor">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.bi}</td>
                    <td>{c.numero}</td>
                    <td>{c.email}</td>
                    <td>{c.estado}</td>
                    <td className="acoes-linha">
                      {tem("CONTA_CRIAR") && <button type="button" className="link" onClick={() => setContaDe(c)}>Abrir conta</button>}
                      {tem("CLIENTE_ATUALIZAR") && <button type="button" className="link" onClick={() => setForm({ ...c })}>Editar</button>}
                      {tem("CLIENTE_ELIMINAR") && <button type="button" className="link perigo" onClick={() => eliminar(c)}>Eliminar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carga>

      <Modal aberto={!!form} aoFechar={() => setForm(null)} titulo={form?.id ? "Editar cliente" : "Novo cliente"}>
        {form && <FormCliente inicial={form} aoConcluir={() => { setForm(null); recarregar(); }} />}
      </Modal>

      <Modal aberto={!!contaDe} aoFechar={() => setContaDe(null)} titulo="Abrir conta">
        {contaDe && <FormConta cliente={contaDe} aoFechar={() => setContaDe(null)} />}
      </Modal>

      {dialogo}
    </>
  );
}

function FormCliente({ inicial, aoConcluir }) {
  const { avisar } = useAvisos();
  const [v, setV] = useState({ nome: inicial.nome || "", bi: inicial.bi || "", numero: inicial.numero || "", email: inicial.email || "" });
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const mudar = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setErro("");
    if (!v.nome.trim() || !v.bi.trim() || !v.numero.trim() || !v.email.trim()) {
      setErro("Preencha o nome, o BI, o telefone e o email.");
      return;
    }
    setAGuardar(true);
    try {
      const corpo = { ...v, nome: v.nome.trim(), email: v.email.trim(), estado: inicial.estado || "ATIVO" };
      if (inicial.id) {
        await ClientesApi.atualizar(inicial.id, corpo);
        avisar("Cliente atualizado.");
      } else {
        await ClientesApi.criar(corpo);
        avisar("Cliente registado.");
      }
      aoConcluir();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form className="form" onSubmit={guardar}>
      <label className="campo"><span>Nome completo</span><input value={v.nome} onChange={mudar("nome")} autoFocus /></label>
      <label className="campo"><span>Número do BI</span><input value={v.bi} onChange={mudar("bi")} /></label>
      <label className="campo"><span>Telefone</span><input inputMode="tel" value={v.numero} onChange={mudar("numero")} /></label>
      <label className="campo"><span>Email</span><input type="email" value={v.email} onChange={mudar("email")} /></label>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button className="btn primario" disabled={aGuardar}>{inicial.id ? "Guardar alterações" : "Registar cliente"}</button>
      </div>
    </form>
  );
}

function FormConta({ cliente, aoFechar }) {
  const [pin, setPin] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [aberta, setAberta] = useState(null);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    if (pin.length !== 4) return setErro("O PIN deve ter exatamente 4 dígitos.");
    if (pin !== confirma) return setErro("A confirmação do PIN não coincide.");
    setAGuardar(true);
    try {
      setAberta(await ContasApi.criar(cliente.id, pin));
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  if (aberta) {
    return (
      <div>
        <p>Conta aberta para <strong>{cliente.nome}</strong>.</p>
        <p className="destaque-numero">{aberta.numeroConta}</p>
        <p className="suave">Entregue ao cliente o número da conta e o PIN que escolheu. Ele usa os dois para entrar na aplicação móvel.</p>
        <div className="acoes-form"><button type="button" className="btn primario" onClick={aoFechar}>Concluir</button></div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={criar}>
      <p>Nova conta para <strong>{cliente.nome}</strong>. Escolha o PIN de 4 dígitos do cliente.</p>
      <CampoPin rotulo="PIN" valor={pin} aoMudar={setPin} autoFocus />
      <CampoPin rotulo="Confirmar PIN" valor={confirma} aoMudar={setConfirma} />
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button className="btn primario" disabled={aGuardar}>Abrir conta</button>
      </div>
    </form>
  );
}
