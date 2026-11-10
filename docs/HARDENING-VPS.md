# Endurecimento do WA-AKG na personal-vps

Passos para aplicar na VPS (`ssh 2-personal-vps`, pasta `~/control-center/wa-akg`). Nada aqui foi aplicado. Faça numa hora em que a Claudia não esteja mandando mensagem, porque o app reinicia e a sessão do WhatsApp reconecta.

O compose de produção é o `~/control-center/wa-akg/compose.yml`, não o `docker-compose.yml` deste repo. Ele faz o build de `./src-repo`, que é um clone deste fork.

## 1. Sem heartbeat e sem Swagger (este PR)

O que muda no código:

- `src/server/index.ts` não manda mais o ping a cada 30 segundos para `api-wa-akg.aikeigroup.net`. Ele levava a URL pública do app (`BASE_URL`), o nome e dados do sistema.
- `/swagger` e `/api/docs` respondem 404, a menos que `SWAGGER_ENABLED=true`. A variável é lida no servidor, a cada request.
- O `NEXT_PUBLIC_SWAGGER_ENABLED` antigo nunca foi lido pelo app. E o usuário e a senha do `/swagger` eram checados só no navegador, com `admin`/`admin123` embutidos no bundle quando o build não recebe as variáveis (o caso do nosso Dockerfile). Por isso o flag não resolvia.

Aplicar, depois do merge:

```bash
cd ~/control-center/wa-akg/src-repo
git fetch origin && git checkout main && git pull --ff-only
cd .. && docker compose build app && docker compose up -d app
```

Conferir:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://wa.mikaelhadler.space/api/docs   # 404
curl -s -o /dev/null -w "%{http_code}\n" https://wa.mikaelhadler.space/swagger    # 404
docker exec wa-akg-app sh -c 'grep -rl aikeigroup /app/src || echo limpo'        # limpo
docker logs --since 5m wa-akg-app | tail -n 50                                    # sessão conectada
```

Voltar: `git checkout c7dd01a` no `src-repo` e o mesmo `build` e `up -d`.

## 2. Usuário próprio no MySQL

Hoje o app conecta como `root` (`DATABASE_URL: mysql://root:...` no `compose.yml`). O app só precisa do banco dele.

1. Gerar uma senha e guardar no 1Password (item novo, por exemplo "WA-AKG MySQL app"). Pôr no `~/control-center/wa-akg/.env` como `WA_AKG_DB_PASSWORD=...`. Não colar a senha em comando que fique no histórico.
2. Criar o usuário com acesso só ao banco do app (o nome está em `MYSQL_DATABASE`, no `.env`):

   ```bash
   cd ~/control-center/wa-akg
   set -a; . ./.env; set +a
   docker exec -i -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" wa-akg-db mysql -uroot <<SQL
   CREATE USER 'wa_akg'@'%' IDENTIFIED BY '$WA_AKG_DB_PASSWORD';
   GRANT ALL PRIVILEGES ON \`$MYSQL_DATABASE\`.* TO 'wa_akg'@'%';
   FLUSH PRIVILEGES;
   SQL
   ```

   `ALL` no banco do app cobre o `prisma db push` (criar e alterar tabelas e índices). Nenhum privilégio global.
3. No `compose.yml`, trocar `mysql://root:${MYSQL_ROOT_PASSWORD}@db:3306/...` por `mysql://wa_akg:${WA_AKG_DB_PASSWORD}@db:3306/...` e subir só o app:

   ```bash
   cp compose.yml compose.yml.bak-$(date +%Y%m%d%H%M)
   docker compose up -d app
   ```

4. Conferir nos logs que o app subiu e a sessão conectou, e mandar uma mensagem de teste de outro número para ver o webhook chegar no control-center.
5. Opcional, depois de uns dias estável: tirar o acesso remoto do root, que fica só com `root@localhost` (o `docker exec` continua funcionando):

   ```sql
   DROP USER 'root'@'%';
   ```

Voltar: restaurar o `compose.yml.bak-*` e `docker compose up -d app`. O usuário `wa_akg` pode ficar.
