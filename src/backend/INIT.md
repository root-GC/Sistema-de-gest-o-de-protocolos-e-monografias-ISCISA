# Sistema de Gestão de Monografias e Protocolos - Backend

## Inicialização do Projecto

Este documento descreve os passos necessários para configurar e iniciar o backend do Sistema de Gestão de Monografias e Protocolos.

## 1. Instalar dependências

Dentro da pasta do backend, executar:

```bash
composer install
```

Este comando instala todas as dependências PHP definidas no ficheiro `composer.json`.

---

## 2. Configurar o ambiente

Criar o ficheiro de configuração `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows, caso o comando acima não funcione, pode copiar manualmente:

```
.env.example -> .env
```

Depois gerar a chave da aplicação:

```bash
php artisan key:generate
```

Configurar no ficheiro `.env` os dados de ligação à base de dados PostgreSQL:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nome_da_base
DB_USERNAME=utilizador
DB_PASSWORD=password
```

---

## 3. Limpar configurações antigas

Antes de executar migrations, limpar possíveis caches existentes:

```bash
php artisan optimize:clear
```

---

## 4. Criar a base de dados

Criar uma base de dados PostgreSQL para o projecto:

```sql
CREATE DATABASE nome_da_base;
```

Depois garantir que os dados no `.env` correspondem à base criada.

---

## 5. Executar migrations

O projecto utiliza uma arquitectura modular, onde cada módulo possui as suas próprias migrations.

Executar no Windows PowerShell:

```powershell
php artisan migrate:fresh `
--path=Modules/Auth/Database/Migrations `
--path=Modules/Organization/Database/Migrations `
--path=Modules/Protocol/Database/Migrations
```

Este comando:

* Remove todas as tabelas existentes;
* Cria novamente a tabela de controlo das migrations;
* Executa todas as migrations dos módulos Auth, Organization e Protocol.

---

## 6. Executar Seeders

Após criar a estrutura da base de dados, inserir os dados iniciais.

### Seeder do módulo Auth

Executar:

```bash
php artisan db:seed --class="Modules\Auth\Database\Seeders\AuthDatabaseSeeder"
```

Este seeder cria:

* Permissões do sistema;
* Perfis de acesso (roles);
* Utilizadores de teste.

---

### Seeder do módulo Organization

Executar:

```bash
php artisan db:seed --class="Modules\Organization\Database\Seeders\OrganizationDatabaseSeeder"
```

Este seeder cria:

* Órgãos;
* Áreas científicas;
* Cursos;
* Perfis organizacionais.

---

## 7. Executar o servidor Laravel

Para iniciar o backend:

```bash
php artisan serve
```

O servidor ficará disponível normalmente em:

```
http://127.0.0.1:8000
```

---

# Comandos úteis

## Ver estado das migrations

```bash
php artisan migrate:status
```

Permite verificar quais migrations já foram executadas.

---

## Listar rotas disponíveis

```bash
php artisan route:list
```

Mostra todas as rotas registadas na aplicação.

---

## Limpar cache

```bash
php artisan optimize:clear
```

Remove:

* Cache de configuração;
* Cache de rotas;
* Cache de views.

---

## Recriar completamente a base de dados

```bash
php artisan migrate:fresh
```

Remove todas as tabelas e executa novamente as migrations.

Com seeders:

```bash
php artisan migrate:fresh --seed
```

---

# Estrutura dos módulos

```
Modules
│
├── Auth
│   └── Database
│       ├── Migrations
│       └── Seeders
│
├── Organization
│   └── Database
│       ├── Migrations
│       └── Seeders
│
└── Protocol
    └── Database
        ├── Migrations
        └── Seeders
```

---

# Ordem recomendada para iniciar o projecto

Executar sempre pela seguinte ordem:

1. Instalar dependências:

```bash
composer install
```

2. Configurar o ficheiro `.env`.

3. Limpar configurações:

```bash
php artisan optimize:clear
```

4. Criar as tabelas:

```powershell
php artisan migrate:fresh 
--path=Modules/Auth/Database/Migrations 
--path=Modules/Organization/Database/Migrations 
--path=Modules/Protocol/Database/Migrations

```

5. Inserir dados iniciais:

```bash
php artisan db:seed --class="Modules\Auth\Database\Seeders\AuthDatabaseSeeder"

php artisan db:seed --class="Modules\Organization\Database\Seeders\OrganizationDatabaseSeeder"

 php artisan db:seed --class="Modules\Protocol\Database\Seeders\ProtocolDatabaseSeeder"                                                           
```

6. Iniciar o servidor:

```bash
php artisan serve
```

Após estes passos, o backend estará configurado e pronto para desenvolvimento.
