# Autenticação — guia rápido

## Arranque
- `JWT_SECRET` (mín. 32 caracteres) — defina em produção.
- `ADMIN_EMAIL` / `ADMIN_SENHA` — administrador inicial. Sem `ADMIN_SENHA`, é gerada uma senha aleatória e mostrada UMA vez no log.
- Se a tabela `usuario_permissoes` já existir com o tipo `enum` antigo: `DROP TABLE usuario_permissoes;` (a app recria-a).
- PINs antigos em texto simples são cifrados (BCrypt) automaticamente no arranque.

## Endpoints
| Quem | Método e caminho | Permissão |
|---|---|---|
| público | `POST /api/auth/login/funcionario` {email, senha} | — |
| público | `POST /api/auth/login/cliente` {numeroConta, pin} | — |
| funcionário | `/api/clientes` (CRUD) | CLIENTE_CRIAR / CONSULTAR / ATUALIZAR / ELIMINAR |
| funcionário | `POST /api/contas` {clienteId, pin} · `GET/PUT/DELETE /api/contas/{id}` | CONTA_CRIAR / CONSULTAR / ATUALIZAR / ELIMINAR |
| funcionário | `PATCH /api/contas/{id}/ativar` · `/desativar` | CONTA_DESBLOQUEAR / CONTA_BLOQUEAR |
| funcionário | `POST /api/transacoes/depositos` {contaDestino, valor, descricao} | DEPOSITO_REALIZAR |
| funcionário | `GET /api/transacoes` · `/api/transacoes/{ref}` · `/api/contas/{id}/extrato` | TRANSACAO_CONSULTAR / EXTRATO_CONSULTAR |
| admin | `/api/funcionarios` (POST cria o login com senha) | FUNCIONARIO_* |
| cliente | `GET /api/minha-conta` · `GET /api/minha-conta/extrato` | token de cliente |
| cliente | `POST /api/minha-conta/transferencias` {contaDestino, valor, descricao} | token de cliente |
| cliente | `PUT /api/minha-conta/pin` {pinAtual, novoPin} | token de cliente |

Todos os pedidos (exceto login) levam `Authorization: Bearer <token>`.

## Administração (usada pela app web)
| Método e caminho | Permissão |
|---|---|
| `GET /api/admin/resumo` | SISTEMA_GERIR |
| `GET /api/admin/usuarios` | FUNCIONARIO_CONSULTAR |
| `GET /api/admin/permissoes` (as que quem pede pode atribuir) | PERMISSAO_GERIR ou FUNCIONARIO_CRIAR |
| `PUT /api/admin/usuarios/{id}/permissoes` {permissoes: [...]} | PERMISSAO_GERIR |
| `PATCH /api/admin/usuarios/{id}/bloquear` · `/desbloquear` | FUNCIONARIO_BLOQUEAR / FUNCIONARIO_DESBLOQUEAR |
| `PUT /api/admin/usuarios/{id}/senha` {novaSenha} | PERMISSAO_GERIR |
| `POST /api/funcionarios` {nome, email, senha, permissoes?} | FUNCIONARIO_CRIAR |

Ninguém concede permissões que não tem, e as permissões de cliente nunca vão para funcionários.
CORS: `CORS_ORIGINS` (por omissão `http://localhost:5173`).
