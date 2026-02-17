========================================
  O APP NÃO ESTÁ ACESSANDO O BANCO (SUPABASE)
========================================

Siga estes passos na ordem:

1. CONFERIR SE AS VARIÁVEIS ENTRARAM NO BUILD (Vercel)
   • No site publicado (URL da Vercel), abra F12 → aba Console.
   • Se aparecer: "[Prime] Erro ao conectar no Supabase: ..." → anote a mensagem (passo 3).
   • Se NÃO aparecer nenhum erro e mesmo assim mostra "Local Mode":
     Pode ser que o build foi feito SEM as variáveis. No Vercel:
     → Deployments → Redeploy no último deploy.
     → Espere terminar e teste de novo.

2. CONFERIR SE AS REQUISIÇÕES SAEM PARA O SUPABASE
   • No site publicado: F12 → aba Rede (Network).
   • Recarregue a página e filtre por "supabase" ou "jqyurjuknfjrofyjzuwg".
   • Se NÃO aparecer NENHUMA requisição para supabase.co:
     O app foi buildado sem VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
     → Vercel: variáveis configuradas + Redeploy.
   • Se aparecer requisições em vermelho (erro 401, 403, 404, 500):
     Anote o código e a mensagem (passo 3).

3. INTERPRETAR O ERRO NO CONSOLE
   • "relation \"users\" does not exist" (ou outra tabela):
     As tabelas ainda não foram criadas no Supabase.
     → No Supabase: Dashboard → SQL Editor.
     → Execute, NA ORDEM, os arquivos em supabase/migrations:
       00001_initial_schema.sql
       00002_daily_routes_avaria.sql
       00003_fixed_expenses_dia_vencimento.sql
       00004_driver_locations.sql
   • Erro 401 (Unauthorized) ou "Invalid API key":
     A chave no Vercel está errada ou é de outro projeto.
     → Supabase: Settings → API → copie de novo a "anon public" key.
     → Vercel: Environment Variables → VITE_SUPABASE_ANON_KEY → cole e salve → Redeploy.
   • Erro de rede (Failed to fetch, CORS, timeout):
     Firewall, VPN ou o projeto Supabase pausado.
     → No Supabase Dashboard confira se o projeto está ativo.

4. RESUMO
   • Variáveis no Vercel + Redeploy para o build ter URL e chave.
   • Migrations rodadas no Supabase (SQL Editor) para as tabelas existirem.
   • Console e Rede (F12) para ver o erro exato.

========================================
