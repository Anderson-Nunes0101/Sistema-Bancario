# Banco Web (back-office)

Aplicação React (Vite) para funcionários e administradores. Lê e escreve tudo no backend `banco` (Spring Boot).
Os clientes continuam a usar a aplicação móvel.

## Como correr
1. Backend a correr (porta 8080). Para a web, ele precisa da configuração de CORS incluída no `banco.zip` atualizado
   (por omissão aceita `http://localhost:5173`; para outro endereço defina `CORS_ORIGINS`).
2. Neste diretório:
   ```
   npm install
   cp .env.example .env     # ajuste VITE_API_URL se o backend não estiver em localhost:8080
   npm run dev
   ```
3. Abra http://localhost:5173 e entre com o administrador criado no arranque do backend
   (`ADMIN_EMAIL` / `ADMIN_SENHA`; sem `ADMIN_SENHA`, a senha aparece uma vez no log).

## O que cada perfil vê
O menu e os botões seguem as permissões do utilizador (e o backend volta a verificá-las em cada pedido).

- **Funcionário**: clientes, contas, depósitos e histórico, conforme as permissões que o administrador lhe deu.
- **Administrador**: tudo isto, mais o painel de administração e "Funcionários e acessos"
  (registar funcionários, escolher permissões, bloquear/desbloquear, repor senhas).
