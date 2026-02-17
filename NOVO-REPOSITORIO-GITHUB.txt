========================================
  CRIAR NOVO PROJETO NO GITHUB (SEM FALHAS)
========================================

Use este passo a passo para criar um repositório novo e enviar o projeto atual.

----------------------------------------
PARTE 1 – Criar o repositório no GitHub
----------------------------------------

1. Abra: https://github.com/new

2. Em "Repository name" digite um nome, por exemplo:
   Prime-novo-v2
   (ou outro nome que preferir)

3. Deixe "Public" marcado.

4. NÃO marque "Add a README" (deixe o repositório vazio).

5. Clique em "Create repository".

6. Anote a URL do repositório que aparecer, por exemplo:
   https://github.com/SEU-USUARIO/Prime-novo-v2

----------------------------------------
PARTE 2 – Enviar o projeto do seu PC
----------------------------------------

OPÇÃO A – Pelo site (Upload files)

1. Abra a pasta do projeto no Explorador:
   C:\Users\USER\Desktop\Nova pasta\prime-projeto-main\prime-projeto-main

2. Ctrl+A (seleciona tudo).
   Segure Ctrl e clique em "node_modules" para desmarcar.

3. No GitHub, na página do repositório novo, clique em:
   "Add file" > "Upload files".

4. Arraste os arquivos selecionados para a área de upload.

5. Escreva uma mensagem (ex.: "Projeto Prime Group - versão restaurada").
   Clique em "Commit changes".

OPÇÃO B – Pelo Git (terminal)

1. Abra PowerShell ou Prompt de Comando.

2. Vá na pasta do repositório (onde está o .git):
   cd "C:\Users\USER\Desktop\Nova pasta\prime-projeto-main"

3. Troque o endereço remoto para o repositório novo
   (substitua SEU-USUARIO e NOME-DO-REPO pelo seu):
   git remote set-url origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git

4. Envie o projeto:
   git push -u origin main

----------------------------------------
PARTE 3 – Ligar na Vercel (opcional)
----------------------------------------

1. Acesse: https://vercel.com

2. "Add New" > "Project".

3. Importe o repositório novo (Prime-novo-v2).

4. Configure as variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).

5. Deploy.

========================================
RESUMO
========================================

• Criar repo novo em github.com/new (vazio, sem README).
• Enviar os arquivos da pasta do projeto (Upload files ou git push).
• Conectar o repo novo na Vercel para ter o app online.

========================================
