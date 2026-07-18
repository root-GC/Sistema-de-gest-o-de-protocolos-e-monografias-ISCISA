<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dashboard Widget Permissions
    |--------------------------------------------------------------------------
    |
    | Mapa de permissões por widget do dashboard.
    |
    | - 'permissions': []       → público (qualquer user autenticado vê)
    - 'any_permission': true   → user precisa de UMA das permissões
    - 'any_permission': false  → user precisa de TODAS as permissões
    |
    */

    'myProtocols' => [
        'permissions' => ['protocol.view'],
        'any_permission' => false,
    ],

    'pendingTriage' => [
        'permissions' => ['protocol.triage'],
        'any_permission' => false,
    ],

    'documentValidation' => [
        'permissions' => ['document.validate'],
        'any_permission' => false,
    ],

    'pendingReviews' => [
        'permissions' => ['protocol.review'],
        'any_permission' => false,
    ],

    'reviewerAssignment' => [
        'permissions' => ['protocol.assign', 'reviewer.assign'],
        'any_permission' => false,
    ],

    'workloadView' => [
        'permissions' => ['workload.view', 'workload.view.all'],
        'any_permission' => true,
    ],

    'pendingEvaluations' => [
        'permissions' => ['evaluation.create'],
        'any_permission' => false,
    ],

    'evaluationResults' => [
        'permissions' => ['evaluation.view', 'evaluation.view.own', 'evaluation.view.all'],
        'any_permission' => true,
    ],

    'defenseSchedule' => [
        'permissions' => ['defense.view'],
        'any_permission' => false,
    ],

    'juryParticipation' => [
        'permissions' => ['defense.jury.participate'],
        'any_permission' => false,
    ],

    'supervisionStudents' => [
        'permissions' => ['supervision.view'],
        'any_permission' => false,
    ],

    'protocolStats' => [
        'permissions' => ['reports.view', 'reports.view.all'],
        'any_permission' => true,
    ],

    'reportsPanel' => [
        'permissions' => ['reports.view', 'reports.view.all'],
        'any_permission' => true,
    ],

    'adminPanel' => [
        'permissions' => ['admin.users', 'admin.organs', 'admin.settings', 'admin.reports'],
        'any_permission' => true,
    ],

    'notifications' => [
        'permissions' => [],
    ],

    'deadlines' => [
        'permissions' => [],
    ],

    'quickActions' => [
        'permissions' => [],
    ],

];
