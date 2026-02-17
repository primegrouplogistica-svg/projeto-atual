
# 🚛 PRIME GROUP - Instruções para Rodar Localmente

Este projeto foi desenvolvido para funcionar como um Web App (PWA) e está configurado para rodar localmente com **Vite** e **React**.

## 📋 Pré-requisitos
- **Node.js** (v18 ou superior) instalado no seu computador.
- Um editor de código (como o **VS Code**).

## 🚀 Como Iniciar

1. **Extraia os arquivos**: Se você usou o script `setup_projeto.py`, os arquivos já estarão na pasta.
2. **Abra o Terminal**: Navegue até a pasta do projeto.
3. **Instale as dependências**:
   ```bash
   npm install
   ```
4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
5. **Acesse o App**: O terminal mostrará um link (geralmente `http://localhost:5173`). Abra-o no seu navegador.

## 📱 Transformando em App de Celular (APK)
Este projeto usa a estrutura compatível com **Capacitor**. Para gerar um APK:
1. Instale o Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. Inicialize: `npx cap init`
3. Adicione o Android: `npx cap add android`
4. Gere o build: `npm run build`
5. Sincronize: `npx cap copy`
6. Abra no Android Studio: `npx cap open android`

## 💾 Armazenamento

- **Sem configuração:** os dados ficam no **LocalStorage** do navegador (modo local). O header mostra "Local Mode".
- **Com Supabase:** os dados são carregados e salvos na nuvem. O header mostra "Online".

### Como ativar a base de dados online (Supabase)

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com).
2. No dashboard do projeto, vá em **SQL Editor** > **New query**. Execute **cada** arquivo abaixo, **na ordem** (copie e cole o conteúdo inteiro e rode):
   - `supabase/migrations/00001_initial_schema.sql` — tabelas principais
   - `supabase/migrations/00002_daily_routes_avaria.sql` — avaria em rotas diárias
   - `supabase/migrations/00003_fixed_expenses_dia_vencimento.sql` — dia do vencimento em despesas
   - `supabase/migrations/00004_driver_locations.sql` — localização em tempo real dos motoristas
3. Em **Project Settings** > **API**, copie:
   - **Project URL**
   - **anon public** (chave pública)
4. Na pasta do projeto, crie o arquivo `.env.local` (pode copiar de `.env.example`) e preencha:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
5. Reinicie o app (`npm run dev`). O header passará a mostrar **"Online"**. Na primeira vez com a base vazia, o app carregará vazio; use normalmente e os dados passarão a ser salvos na nuvem (incluindo localização dos motoristas em tempo real).

---

# 🌐 Guia passo a passo: App online + base de dados funcionando

Siga na ordem. No final você terá o app acessível por um link na internet e todos os dados na nuvem (Supabase).

---

## PARTE 1 — Base de dados (Supabase)

### Passo 1.1 — Criar conta e projeto

1. Acesse **[supabase.com](https://supabase.com)** e clique em **Start your project**.
2. Crie uma conta (Google ou e-mail).
3. Clique em **New Project**.
4. Preencha:
   - **Name:** por exemplo `prime-group`
   - **Database Password:** crie e **guarde** uma senha forte (você vai precisar só para acessos avançados).
   - **Region:** escolha a mais próxima (ex.: South America (São Paulo)).
5. Clique em **Create new project** e aguarde alguns minutos.

### Passo 1.2 — Criar as tabelas no banco

1. No menu lateral do Supabase, clique em **SQL Editor**.
2. Clique em **+ New query**.
3. Abra no seu computador o arquivo **`supabase/migrations/00001_initial_schema.sql`** (pasta do projeto Prime Group).
4. Copie **todo** o conteúdo do arquivo (Ctrl+A, Ctrl+C).
5. Cole no editor SQL do Supabase e clique em **Run** (ou Ctrl+Enter). Deve aparecer “Success”.
6. Repita para os outros arquivos, **sempre na ordem**:
   - **00002_daily_routes_avaria.sql** → Run
   - **00003_fixed_expenses_dia_vencimento.sql** → Run
   - **00004_driver_locations.sql** → Run

Se todos derem “Success”, a base está pronta.

### Passo 1.3 — Copiar URL e chave da API

1. No menu lateral, clique em **Project Settings** (ícone de engrenagem).
2. Clique em **API** no submenu.
3. Na seção **Project URL**, clique no ícone de copiar e guarde (ex.: `https://abcdefgh.supabase.co`).
4. Na seção **Project API keys**, copie a chave **anon** **public** (não use a chave `service_role`). Ela começa com `eyJ...` e é longa.

Você vai usar esses dois valores no app (local e na hospedagem).

### Passo 1.4 — Configurar o app localmente

1. Na pasta do projeto (onde está o `package.json`), crie um arquivo chamado **`.env.local`**.
2. Se existir **`.env.example`**, você pode copiá-lo e renomear para `.env.local`.
3. Abra `.env.local` e deixe exatamente assim (trocando pelos seus valores):

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI
   ```

4. Salve o arquivo.
5. No terminal, na pasta do projeto, rode:
   ```bash
   npm run dev
   ```
6. Abra o app no navegador. No topo da tela deve aparecer **“Online”** (verde). Se aparecer, a base de dados está funcionando.

---

## PARTE 2 — Deixar o app online (acessível por link)

Recomendação: **Vercel** (grátis e simples para este projeto).

### Passo 2.1 — Conta na Vercel

1. Acesse **[vercel.com](https://vercel.com)** e clique em **Sign Up**.
2. Crie a conta (por exemplo com GitHub). Se o projeto estiver no GitHub, a Vercel conecta direto.

### Passo 2.2 — Enviar o projeto para o GitHub

1. No **[github.com](https://github.com)**, faça login e clique no **+** (canto superior direito) → **New repository**.
2. Preencha:
   - **Repository name:** por exemplo `prime-group-app` (sem espaços).
   - **Description:** opcional (ex.: "App Prime Group").
   - Deixe **Public**.
   - **Não** marque "Add a README" (o projeto já tem arquivos).
3. Clique em **Create repository**.
4. A página do repositório vai mostrar um link. Anote: `https://github.com/SEU-USUARIO/prime-group-app.git` (troque SEU-USUARIO pelo seu usuário do GitHub).
5. Abra o **terminal** (PowerShell ou CMD) e vá até a pasta do projeto, por exemplo:
   ```bash
   cd "C:\Users\USER\Desktop\Nova pasta\prime-projeto-main\prime-projeto-main"
   ```
6. Rode os comandos abaixo **um por um** (troque a URL pelo link do seu repositório):

   ```bash
   git init
   git add .
   git commit -m "Prime Group - app e migrations"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/prime-group-app.git
   git push -u origin main
   ```

7. Na primeira vez que rodar `git push`, o GitHub pode pedir **login** (usuário e senha). Se pedir senha, use um **Personal Access Token** em vez da senha da conta: em GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Generate new token**, marque **repo** e use o token como senha.
8. Depois do `git push`, atualize a página do repositório no navegador: todos os arquivos do projeto devem aparecer lá.

### Passo 2.3 — Criar o projeto na Vercel

1. No painel da Vercel, clique em **Add New** → **Project**.
2. **Import** o repositório do GitHub (se conectou a conta, ele lista os repositórios). Selecione o do Prime Group.
3. Em **Configure Project**:
   - **Framework Preset:** Vite (deve detectar sozinho).
   - **Root Directory:** deixe em branco.
   - **Build Command:** `npm run build` (já vem assim).
   - **Output Directory:** `dist` (já vem assim).
4. Clique em **Environment Variables** e adicione **duas** variáveis (use os mesmos valores do `.env.local`):

   | Name                  | Value                          |
   |-----------------------|---------------------------------|
   | `VITE_SUPABASE_URL`   | `https://SEU-PROJETO.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` (sua chave anon)       |

5. Clique em **Deploy**. Aguarde o build terminar.

### Passo 2.4 — Acessar o app online

1. Quando o deploy terminar, a Vercel mostra um link, por exemplo:  
   `https://prime-group-app.vercel.app`
2. Clique no link (ou copie e abra no celular). O app deve abrir e, no topo, mostrar **“Online”**.
3. Faça login com um usuário que você já tenha cadastrado (se a base estava vazia, cadastre primeiro pelo app local com Supabase ativo, ou crie usuários direto na tabela `users` no Supabase).

---

## ✅ Checklist final

- [ ] Conta e projeto criados no Supabase  
- [ ] As 4 migrations executadas no SQL Editor (00001 a 00004)  
- [ ] URL e chave anon copiadas do Supabase  
- [ ] Arquivo `.env.local` criado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`  
- [ ] App local mostra **“Online”** ao rodar `npm run dev`  
- [ ] Código no GitHub (se for usar Vercel)  
- [ ] Projeto criado na Vercel com as mesmas variáveis de ambiente  
- [ ] Deploy concluído e link do app aberto no navegador/celular  

Se todos os itens estiverem ok, o app está **online** e com a **base de dados funcionando**.
