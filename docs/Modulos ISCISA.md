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



 Modules/Monograph/
 ├── Controllers/
 │    ├── MonographController.php
 │
 ├── Services/
 │    ├── MonographService.php
 │    ├── AdministrativeValidationService.php
 │
 ├── Interfaces/
 │    ├── MonographServiceInterface.php
 │
 ├── Models/
 │    ├── Monograph.php
 │
 ├── Repositories/
 │    ├── MonographRepository.php
 │
 ├── Integration/
 │    ├── ProtocolBridge.php   ← usa lógica de Protocol
 │
 ├── Documents/
 │    ├── DocumentService.php
 │
 ├── Database/
 │    ├── Migrations/
 │    │     ├── create_monographs_table.php
 │    │     ├── create_documents_table.php
 │    │
 │    ├── Seeders/
 │          ├── MonographSeeder.php
 │
 ├── Routes/
 │    ├── api.php


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


 