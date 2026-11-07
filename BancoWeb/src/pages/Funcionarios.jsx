import { useState } from "react";
import { AdminApi } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useAvisos } from "../avisos.jsx";
import { Cabecalho, Carga, Estado, Modal, Vazio, useConfirmar } from "../components.jsx";
import { useCarregar } from "../hooks.js";
import { GRUPOS, PACOTE_PADRAO, PERFIL, ROTULOS } from "../util.js";

export default function Funcionarios() {
  const { tem } = useAuth();
  const { avisar } = useAvisos();
  const { confirmar, dialogo } = useConfirmar();

  const lista = useCarregar(() => AdminApi.usuarios());
  const atribuiveis = useCarregar(() =>
    tem("PERMISSAO_GERIR") || tem("FUNCIONARIO_CRIAR") ? AdminApi.permissoes() : Promise.resolve([])
  );

  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState(null);
  const [permissoes, setPermissoes] = useState(null);
  const [senha, setSenha] = useState(null);

  const disponiveis = atribuiveis.dados || [];

  async function executar(acao, sucesso) {
    try {
      await acao();
      avisar(sucesso);
      lista.recarregar();
    } catch (e) {
      avisar(e.message, "erro");
    }
  }

  function bloquear(u) {
    confirmar(
      `Bloquear ${u.nome}? Perde o acesso imediatamente, mesmo com a sessão aberta.`,
      () => executar(() => AdminApi.bloquear(u.id), `${u.nome} foi bloqueado.`),
      "Bloquear"
    );
  }

  function eliminar(u) {
    confirmar(
      `Eliminar ${u.nome} e o respetivo acesso? Esta ação não pode ser desfeita.`,
      () => executar(() => AdminApi.eliminarFuncionario(u.funcionarioId), `${u.nome} foi eliminado.`),
      "Eliminar funcionário"
    );
  }

  const bloqueioAtivo = (u) => u.bloqueadoAte && Date.parse(u.bloqueadoAte) > Date.now();

  return (
    <>
      <Cabecalho titulo="Funcionários e acessos" descricao="Registe funcionários e defina exatamente o que cada um pode fazer.">
        {tem("FUNCIONARIO_CRIAR") && (
          <button type="button" className="btn primario" onClick={() => setNovo(true)}>Novo funcionário</button>
        )}
      </Cabecalho>

      <Carga {...lista} aoTentar={lista.recarregar}>
        {(lista.dados || []).length === 0 ? (
          <Vazio>Ainda não há funcionários registados.</Vazio>
        ) : (
          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th><th>Email</th><th>Perfil</th><th>Estado</th><th>Permissões</th>
                  <th><span className="so-leitor">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {lista.dados.map((u) => {
                  const admin = u.tipo === "ADMIN";
                  return (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>{PERFIL[u.tipo] || u.tipo}</td>
                      <td>
                        <Estado ativo={u.estado === "ATIVO"} ativoRotulo="Ativo" inativoRotulo="Bloqueado" />
                        {bloqueioAtivo(u) && <span className="nota">Bloqueio temporário por tentativas falhadas</span>}
                      </td>
                      <td>{admin ? "Todas" : u.permissoes.length}</td>
                      <td className="acoes-linha">
                        {!admin && tem("PERMISSAO_GERIR") && (
                          <button type="button" className="link" onClick={() => setPermissoes(u)}>Permissões</button>
                        )}
                        {u.funcionarioId && tem("FUNCIONARIO_ATUALIZAR") && (
                          <button type="button" className="link" onClick={() => setEditar(u)}>Editar</button>
                        )}
                        {tem("PERMISSAO_GERIR") && (
                          <button type="button" className="link" onClick={() => setSenha(u)}>Repor senha</button>
                        )}
                        {!admin && u.estado === "ATIVO" && tem("FUNCIONARIO_BLOQUEAR") && (
                          <button type="button" className="link perigo" onClick={() => bloquear(u)}>Bloquear</button>
                        )}
                        {!admin && (u.estado !== "ATIVO" || bloqueioAtivo(u)) && tem("FUNCIONARIO_DESBLOQUEAR") && (
                          <button
                            type="button"
                            className="link"
                            onClick={() => executar(() => AdminApi.desbloquear(u.id), `${u.nome} foi desbloqueado.`)}
                          >
                            Desbloquear
                          </button>
                        )}
                        {u.funcionarioId && tem("FUNCIONARIO_ELIMINAR") && (
                          <button type="button" className="link perigo" onClick={() => eliminar(u)}>Eliminar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Carga>

      <Modal aberto={novo} aoFechar={() => setNovo(false)} titulo="Novo funcionário" largo>
        {novo && (
          <FormNovo
            disponiveis={disponiveis}
            aoConcluir={() => { setNovo(false); lista.recarregar(); }}
          />
        )}
      </Modal>

      <Modal aberto={!!editar} aoFechar={() => setEditar(null)} titulo="Editar funcionário">
        {editar && <FormEditar utilizador={editar} aoConcluir={() => { setEditar(null); lista.recarregar(); }} />}
      </Modal>

      <Modal aberto={!!permissoes} aoFechar={() => setPermissoes(null)} titulo={`Permissões de ${permissoes?.nome}`} largo>
        {permissoes && (
          <FormPermissoes
            utilizador={permissoes}
            disponiveis={disponiveis}
            aoConcluir={() => { setPermissoes(null); lista.recarregar(); }}
          />
        )}
      </Modal>

      <Modal aberto={!!senha} aoFechar={() => setSenha(null)} titulo={`Repor senha de ${senha?.nome}`}>
        {senha && <FormSenha utilizador={senha} aoConcluir={() => { setSenha(null); lista.recarregar(); }} />}
      </Modal>

      {dialogo}
    </>
  );
}

/** Caixas de seleção agrupadas. Só se podem ADICIONAR permissões que quem edita também possui. */
function EditorPermissoes({ valor, aoMudar, disponiveis }) {
  const alternar = (k) => aoMudar(valor.includes(k) ? valor.filter((x) => x !== k) : [...valor, k]);

  return (
    <div className="editor-perm">
      {GRUPOS.map((g) => (
        <fieldset key={g.titulo}>
          <legend>{g.titulo}</legend>
          {g.chaves.map((k) => {
            const marcado = valor.includes(k);
            const bloqueado = !marcado && !disponiveis.includes(k);
            return (
              <label key={k} className={"caixa" + (bloqueado ? " desativada" : "")}>
                <input type="checkbox" checked={marcado} disabled={bloqueado} onChange={() => alternar(k)} />
                <span>{ROTULOS[k]}</span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}

function FormNovo({ disponiveis, aoConcluir }) {
  const { avisar } = useAvisos();
  const [v, setV] = useState({ nome: "", email: "", senha: "" });
  const [perms, setPerms] = useState(() => PACOTE_PADRAO.filter((k) => disponiveis.includes(k)));
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const mudar = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function criar(e) {
    e.preventDefault();
    setErro("");
    if (!v.nome.trim() || !v.email.trim()) return setErro("Indique o nome e o email.");
    if (v.senha.length < 8) return setErro("A senha deve ter pelo menos 8 caracteres.");
    setAGuardar(true);
    try {
      await AdminApi.criarFuncionario({ nome: v.nome.trim(), email: v.email.trim(), senha: v.senha, permissoes: perms });
      avisar(`Funcionário ${v.nome.trim()} registado. Entregue-lhe o email e a senha inicial.`);
      aoConcluir();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form className="form" onSubmit={criar}>
      <div className="duas-colunas">
        <label className="campo"><span>Nome completo</span><input value={v.nome} onChange={mudar("nome")} autoFocus /></label>
        <label className="campo"><span>Email (usado para entrar)</span><input type="email" value={v.email} onChange={mudar("email")} /></label>
      </div>
      <label className="campo">
        <span>Senha inicial (mínimo 8 caracteres)</span>
        <input type="password" autoComplete="new-password" value={v.senha} onChange={mudar("senha")} />
      </label>
      <h3>O que este funcionário pode fazer</h3>
      <EditorPermissoes valor={perms} aoMudar={setPerms} disponiveis={disponiveis} />
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button className="btn primario" disabled={aGuardar}>Registar funcionário</button>
      </div>
    </form>
  );
}

function FormEditar({ utilizador, aoConcluir }) {
  const { avisar } = useAvisos();
  const [nome, setNome] = useState(utilizador.nome);
  const [email, setEmail] = useState(utilizador.email);
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setErro("");
    if (!nome.trim() || !email.trim()) return setErro("Indique o nome e o email.");
    setAGuardar(true);
    try {
      await AdminApi.atualizarFuncionario(utilizador.funcionarioId, {
        nome: nome.trim(),
        email: email.trim(),
        estado: utilizador.estado === "ATIVO" ? "ATIVO" : "BLOQUEADO"
      });
      avisar("Dados do funcionário atualizados.");
      aoConcluir();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form className="form" onSubmit={guardar}>
      <label className="campo"><span>Nome completo</span><input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></label>
      <label className="campo"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form"><button className="btn primario" disabled={aGuardar}>Guardar alterações</button></div>
    </form>
  );
}

function FormPermissoes({ utilizador, disponiveis, aoConcluir }) {
  const { avisar } = useAvisos();
  const [perms, setPerms] = useState(utilizador.permissoes);
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setErro("");
    setAGuardar(true);
    try {
      await AdminApi.definirPermissoes(utilizador.id, perms);
      avisar("Permissões atualizadas. Têm efeito logo no próximo pedido do funcionário.");
      aoConcluir();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form className="form" onSubmit={guardar}>
      <EditorPermissoes valor={perms} aoMudar={setPerms} disponiveis={disponiveis} />
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form"><button className="btn primario" disabled={aGuardar}>Guardar permissões</button></div>
    </form>
  );
}

function FormSenha({ utilizador, aoConcluir }) {
  const { avisar } = useAvisos();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setErro("");
    if (senha.length < 8) return setErro("A senha deve ter pelo menos 8 caracteres.");
    setAGuardar(true);
    try {
      await AdminApi.reporSenha(utilizador.id, senha);
      avisar(`Senha de ${utilizador.nome} reposta. Também levanta qualquer bloqueio por tentativas falhadas.`);
      aoConcluir();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form className="form" onSubmit={guardar}>
      <label className="campo">
        <span>Nova senha (mínimo 8 caracteres)</span>
        <input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} autoFocus />
      </label>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form"><button className="btn primario" disabled={aGuardar}>Repor senha</button></div>
    </form>
  );
}
