# 📚 SGPC-ISCISA  
**Sistema de Gestão de Protocolos e Monografias Científicas**

---

## 🧠 Visão Geral

O **SGPC-ISCISA** é uma plataforma web desenvolvida para digitalizar, automatizar e centralizar todo o ciclo de vida das pesquisas científicas no Instituto Superior de Ciências de Saúde (ISCISA).

O sistema elimina processos manuais, melhora a rastreabilidade e garante maior transparência e integridade académica.

---

## 🚨 Problema

Actualmente, o processo é:

- Manual e baseado em papel  
- Difícil de rastrear  
- Sem histórico centralizado  
- Pouco transparente para estudantes  
- Susceptível a erros e fraudes  
- Sem dados para tomada de decisão  

**Resultado:**  
👉 Atrasos, confusão e desgaste desnecessário.

---

## 💡 Solução

Uma plataforma centralizada que:

- Automatiza o fluxo de aprovação  
- Regista todo o histórico  
- Notifica os intervenientes em tempo real  
- Garante validações obrigatórias  
- Fornece métricas e relatórios  

---

## 🏗️ Funcionalidades Principais

### 📥 Submissão Digital
- Upload de protocolos e monografias  
- Controlo de versões  
- Validação obrigatória do supervisor  

### 🔄 Workflow Automatizado
- Encaminhamento entre órgãos:
  - Núcleo Científico  
  - Comitê Científico  
  - Comitê de Bioética  
- Histórico visível entre etapas  

### 🕵️ Revisão Anónima
- Feedback anónimo  
- Registo estruturado de correções  
- Redução de conflitos pessoais  

### ✅ Verificação Administrativa
- Checklist automático (financeiro + académico)  
- Integração com serviços institucionais  
- Notificação de pendências  

### 🎓 Gestão de Defesas
- Alocação de júri  
- Sugestão e confirmação de datas  
- Gestão de salas  
- Cálculo automático de notas  
- Upload da ata final  

### 📊 Business Intelligence
- Dashboard em tempo real  
- Relatórios por curso, fase e período  
- Identificação de gargalos  

---

## 👥 Utilizadores do Sistema

- Estudantes  
- Supervisores  
- Núcleos Científicos  
- Comitê Científico  
- Comitê de Bioética  
- Direção Científica  
- Coordenação de Cursos  
- Júri (Presidente e Oponente)  
- Registo Académico  
- Finanças  

---

## 🔁 Fluxo do Sistema

### 1. Protocolo
Submissão → Núcleo → Comitê Científico → Bioética

### 2. Campo
Recolha de dados (fora do sistema)

### 3. Monografia
Submissão → Verificação → Júri → Defesa → Ata

---

## 🎯 Objectivos

- 📦 Centralizar dados  
- 🔍 Garantir rastreabilidade  
- 🔐 Assegurar integridade académica  
- 📈 Melhorar a qualidade científica  
- ⚡ Reduzir atrasos  
- 📊 Apoiar decisões com dados  

---

## 🧱 Possível Stack Tecnológica

*(ajustável conforme a equipa)*

### Backend
- Laravel  
- Spring Boot  
- Node.js  

### Frontend
- React  
- Vue.js  

### Base de Dados
- PostgreSQL  
- MySQL  

### Infraestrutura
- Docker  
- Nginx  
- Cloud (AWS, Azure ou local)  
>>>>>>> 19a6ad1 (Primeiro commit)



Modules/Protocol/
 ├── Controllers/
 │    ├── ProtocolController.php
 │    ├── SubmissionController.php
 │
 ├── Services/
 │    ├── ProtocolService.php
 │    ├── SubmissionService.php
 │    ├── SupervisorValidationService.php
 │
 ├── Interfaces/
 │    ├── ProtocolServiceInterface.php
 │
 ├── Models/
 │    ├── Protocol.php
 │    ├── ProtocolVersion.php
 │
 ├── Repositories/
 │    ├── ProtocolRepository.php
 │
 ├── Workflow/
 │    ├── WorkflowService.php
 │    ├── StateMachine.php
 │
 ├── Review/
 │    ├── BlindReviewService.php
 │    ├── ReviewRepository.php
 │
 ├── Notifications/
 │    ├── NotificationService.php
 │
 ├── Events/
 │    ├── ProtocolSubmitted.php
 │    ├── ProtocolApproved.php
 │
 ├── Database/
 │    ├── Migrations/
 │    │     ├── create_protocols_table.php
 │    │     ├── create_protocol_versions_table.php
 │    │     ├── create_reviews_table.php
 │    │
 │    ├── Seeders/
 │          ├── ProtocolSeeder.php
 │
 ├── Routes/
 │    ├── api.php


 Modules/Auth/
 ├── Controllers/
 │    ├── LoginController.php
 │    ├── PasswordController.php
 │
 ├── Services/
 │    ├── AuthService.php
 │    ├── UserService.php
 │
 ├── Interfaces/
 │    ├── AuthServiceInterface.php
 │    ├── UserServiceInterface.php
 │
 ├── Models/
 │    ├── User.php
 │    ├── Role.php
 │
 ├── Repositories/
 │    ├── UserRepository.php
 │
 ├── Database/
 │    ├── Migrations/
 │    │     ├── create_users_table.php
 │    │     ├── create_roles_table.php
 │    │
 │    ├── Seeders/
 │          ├── UserSeeder.php
 │          ├── RoleSeeder.php
 │
 ├── Routes/
 │    ├── api.php
 │
 └── Events/
      ├── UserLoggedIn.php


app/
 └── Modules/
      ├── Auth/
      ├── Protocol/
      ├── Monograph/
      ├── Defense/




Modules/Defense/
 ├── Controllers/
 │    ├── DefenseController.php
 │
 ├── Services/
 │    ├── DefenseService.php
 │    ├── JuryService.php
 │    ├── ScheduleService.php
 │
 ├── Interfaces/
 │    ├── DefenseServiceInterface.php
 │
 ├── Models/
 │    ├── Defense.php
 │    ├── Jury.php
 │
 ├── Repositories/
 │    ├── DefenseRepository.php
 │
 ├── Scheduling/
 │    ├── ConflictResolver.php
 │
 ├── BI/
 │    ├── ReportService.php
 │    ├── MetricsService.php
 │
 ├── Database/
 │    ├── Migrations/
 │    │     ├── create_defenses_table.php
 │    │     ├── create_juries_table.php
 │    │
 │    ├── Seeders/
 │          ├── DefenseSeeder.php
 │
 ├── Routes/
 │    ├── api.php