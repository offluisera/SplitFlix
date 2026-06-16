# 🔧 Setup XAMPP — Guia de resolução de problemas

## Passo 1: Estrutura correta de pastas

Coloque as pastas assim no XAMPP:
```
C:/xampp/htdocs/splitflix/
├── backend/        ← pasta do PHP
├── frontend/       ← pasta do React  
└── database/       ← SQL
```

**Atenção:** A pasta `backend` deve estar DENTRO de `splitflix/`.

## Passo 2: Habilitar mod_rewrite no XAMPP

1. Abra `C:/xampp/apache/conf/httpd.conf`
2. Procure e descomente (remova o #):
   ```
   LoadModule rewrite_module modules/mod_rewrite.so
   ```
3. Procure `<Directory "C:/xampp/htdocs">` e mude:
   ```
   AllowOverride None
   ```
   Para:
   ```
   AllowOverride All
   ```
4. Reinicie o Apache no XAMPP Control Panel

## Passo 3: Banco de dados

1. Abra `http://localhost/phpmyadmin`
2. Clique em "Novo" → crie banco `splitflix`
3. Clique no banco → aba "Importar" → selecione `database/splitflix.sql`

## Passo 4: Testar o backend

Acesse: `http://localhost/splitflix/backend/test.php`

Deve retornar JSON como:
```json
{
  "status": "ok",
  "php": "8.0.30",
  "extensions": { "pdo": true, "pdo_mysql": true, ... }
}
```

Se aparecer erro 500, verifique:
- `http://localhost/splitflix/backend/test.php` sem mod_rewrite
- Os logs em: `C:/xampp/apache/logs/error.log`

## Passo 5: Frontend

```bash
cd C:/xampp/htdocs/splitflix/frontend
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## Passo 6: Login

- **E-mail:** admin@splitflix.local  
- **Senha:** Admin@2026!

---

## ❌ Erro 500 comum: "AllowOverride None"

Este é o erro mais comum em XAMPP. O `.htaccess` é ignorado por padrão.

Solução rápida — adicione ao final do `httpd.conf`:
```apache
<Directory "C:/xampp/htdocs/splitflix/backend">
    AllowOverride All
    Require all granted
</Directory>
```

## ❌ Erro CORS no console do navegador

O frontend está em `localhost:5173` e o backend em `localhost/splitflix/backend`.
O proxy do Vite deve resolver isso automaticamente em desenvolvimento.

Se ainda aparecer CORS, verifique se `CORS_ALLOWED_ORIGINS` em `backend/config/app.php`
inclui `http://localhost:5173`.
