// mocks/dashboardData.ts

export const mockDashboardData = {
  // ========================
  // FLUXO DE TRABALHO
  // ========================
  
  myProtocols: {
    protocols: [
      {
        id: 1,
        title: "Avaliação da Eficácia de Plantas Medicinais no Tratamento da Malária em Crianças Menores de 5 Anos na Província de Nampula",
        status: "em_revisao",
        statusLabel: "Em Revisão",
        statusColor: "warning",
        submissionDate: "2024-01-15",
        lastUpdate: "2024-01-20",
        course: "Licenciatura em Medicina Geral",
        supervisor: "Dr. Armando Macuácua",
        progress: 65,
        documents: [
          { type: "protocolo", status: "aprovado", date: "2024-01-15" },
          { type: "cronograma", status: "pendente", date: null }
        ],
        reviewers: 2,
        reviewsCompleted: 1
      },
      {
        id: 2,
        title: "Impacto da Suplementação com Vitamina A na Redução da Morbidade por Doenças Diarreicas em Crianças dos 6-59 Meses no Distrito de Mocuba",
        status: "triagem",
        statusLabel: "Em Triagem",
        statusColor: "info",
        submissionDate: "2024-02-01",
        lastUpdate: "2024-02-01",
        course: "Licenciatura em Farmácia",
        supervisor: "Dra. Carla Mondlane",
        progress: 25,
        documents: [
          { type: "protocolo", status: "pendente", date: null },
          { type: "questionario", status: "pendente", date: null }
        ],
        reviewers: 0,
        reviewsCompleted: 0
      },
      {
        id: 3,
        title: "Prevalência de Hipertensão Arterial e Fatores de Risco Associados em Adultos na Cidade de Maputo",
        status: "aprovado",
        statusLabel: "Aprovado",
        statusColor: "success",
        submissionDate: "2023-11-20",
        lastUpdate: "2024-01-10",
        course: "Licenciatura em Enfermagem",
        supervisor: "Dr. João Zimba",
        progress: 100,
        documents: [
          { type: "protocolo", status: "aprovado", date: "2023-12-15" },
          { type: "parecer_etico", status: "aprovado", date: "2024-01-08" }
        ],
        reviewers: 2,
        reviewsCompleted: 2
      },
      {
        id: 4,
        title: "Análise da Cobertura Vacinal contra o Sarampo em Menores de 1 Ano nos Distritos da Província de Gaza, 2020-2023",
        status: "não aprovado",
        statusLabel: "Não Aprovado",
        statusColor: "error",
        submissionDate: "2024-01-05",
        lastUpdate: "2024-01-12",
        course: "Mestrado em Saúde Pública",
        supervisor: "Prof. Doutora Ana Mussa",
        progress: 100,
        documents: [
          { type: "protocolo", status: "não aprovado", date: "2024-01-12" }
        ],
        rejectionReason: "Metodologia inadequada para o tipo de estudo proposto. Necessário rever o desenho do estudo.",
        reviewers: 2,
        reviewsCompleted: 2
      }
    ],
    stats: {
      total: 4,
      emTriagem: 1,
      emRevisao: 1,
      aprovados: 1,
      rejeitados: 1
    }
  },

  protocolWorkflow: {
    protocols: [
      {
        id: "pw1",
        code: "PROT-2024-001",
        title: "Avaliação da Eficácia de Plantas Medicinais no Tratamento da Malária em Crianças Menores de 5 Anos na Província de Nampula",
        student: "Carlos Alberto Matusse",
        course: "Licenciatura em Medicina Geral",
        currentStep: 3,
        totalSteps: 6,
        estimatedCompletion: "15 de Maio 2024",
        progressPercentage: 50,
        steps: [
          {
            id: "step1",
            label: "Submissão do Protocolo",
            description: "Envio do documento inicial com tema, objetivos e metodologia proposta",
            icon: "upload_file",
            status: "completed",
            date: "15 Jan 2024",
            actor: "Carlos Alberto Matusse",
            documents: [
              { name: "Protocolo_Inicial_v1.pdf", url: "#", status: "approved" },
              { name: "Declaração_Supervisor.pdf", url: "#", status: "approved" }
            ]
          },
          {
            id: "step2",
            label: "Triagem Documental",
            description: "Verificação administrativa dos documentos e requisitos formais",
            icon: "fact_check",
            status: "completed",
            date: "18 Jan 2024",
            actor: "Secretaria Académica",
            comment: "Documentos em conformidade. Protocolo encaminhado para revisão metodológica."
          },
          {
            id: "step3",
            label: "Revisão Metodológica",
            description: "Avaliação da metodologia científica por especialista da área",
            icon: "biotech",
            status: "active",
            date: "20 Jan 2024",
            actor: "Prof. Doutor Armando Macuácua",
            comment: "Metodologia bem estruturada. Solicitados ajustes na definição da amostra e nos critérios de inclusão/exclusão. Prazo para correções: 20 Fev 2024.",
            documents: [
              { name: "Parecer_Metodológico.pdf", url: "#", status: "pending" },
              { name: "Protocolo_Revisado_v2.pdf", url: "#", status: "pending" }
            ]
          },
          {
            id: "step4",
            label: "Revisão Ética",
            description: "Avaliação pelo Comité Institucional de Bioética para Saúde",
            icon: "gavel",
            status: "pending"
          },
          {
            id: "step5",
            label: "Aprovação Final",
            description: "Decisão final do Conselho Científico sobre a realização do estudo",
            icon: "verified",
            status: "pending"
          },
          {
            id: "step6",
            label: "Defesa do Protocolo",
            description: "Apresentação e defesa pública do protocolo perante júri",
            icon: "school",
            status: "pending"
          }
        ],
        timeline: [
          {
            date: "15 Jan 2024 - 14:30",
            event: "Protocolo Submetido",
            type: "submission",
            details: "Documento inicial enviado através da plataforma SGPMC"
          },
          {
            date: "16 Jan 2024 - 09:00",
            event: "Confirmação de Recepção",
            type: "submission",
            details: "Sistema confirmou recepção e atribuiu código PROT-2024-001"
          },
          {
            date: "18 Jan 2024 - 11:00",
            event: "Triagem Aprovada",
            type: "approval",
            details: "Secretaria verificou documentos e aprovou para revisão"
          },
          {
            date: "20 Jan 2024 - 15:00",
            event: "Revisor Designado",
            type: "review",
            details: "Prof. Doutor Armando Macuácua designado como revisor metodológico"
          },
          {
            date: "25 Jan 2024 - 16:30",
            event: "Parecer Metodológico Emitido",
            type: "review",
            details: "Revisor solicitou ajustes na definição da amostra. Prazo: 20 Fev 2024"
          }
        ]
      },
      {
        id: "pw2",
        code: "PROT-2024-015",
        title: "Impacto da Suplementação com Vitamina A na Redução da Morbidade por Doenças Diarreicas",
        student: "Lucia Francisco Mandlate",
        course: "Mestrado em Saúde Pública",
        currentStep: 4,
        totalSteps: 6,
        estimatedCompletion: "30 de Junho 2024",
        progressPercentage: 75,
        steps: [
          {
            id: "step1",
            label: "Submissão do Protocolo",
            description: "Envio do documento inicial",
            icon: "upload_file",
            status: "completed",
            date: "05 Jan 2024"
          },
          {
            id: "step2",
            label: "Triagem Documental",
            description: "Verificação administrativa",
            icon: "fact_check",
            status: "completed",
            date: "08 Jan 2024"
          },
          {
            id: "step3",
            label: "Revisão Metodológica",
            description: "Avaliação metodológica",
            icon: "biotech",
            status: "completed",
            date: "15 Jan 2024",
            comment: "Metodologia aprovada sem ressalvas"
          },
          {
            id: "step4",
            label: "Revisão Ética",
            description: "Avaliação ética",
            icon: "gavel",
            status: "active",
            date: "20 Jan 2024",
            actor: "Comité de Bioética",
            comment: "Em análise pelo comité. Aguardando parecer."
          },
          {
            id: "step5",
            label: "Aprovação Final",
            description: "Decisão final",
            icon: "verified",
            status: "pending"
          },
          {
            id: "step6",
            label: "Defesa do Protocolo",
            description: "Defesa pública",
            icon: "school",
            status: "pending"
          }
        ],
        timeline: [
          {
            date: "05 Jan 2024 - 10:00",
            event: "Protocolo Submetido",
            type: "submission",
            details: "Documento enviado pela plataforma"
          },
          {
            date: "15 Jan 2024 - 14:00",
            event: "Aprovação Metodológica",
            type: "approval",
            details: "Metodologia aprovada sem ressalvas pelo revisor"
          },
          {
            date: "20 Jan 2024 - 09:00",
            event: "Encaminhado para Comité de Ética",
            type: "review",
            details: "Protocolo em análise ética"
          }
        ]
      }
    ]
  },

  pendingTriage: {
    items: [
      {
        id: 101,
        protocolTitle: "Estudo sobre Desnutrição Crónica em Menores de 5 Anos na Zambézia",
        student: "Maria Alberto Muando",
        studentNumber: "01.4038.2023",
        course: "Licenciatura em Nutrição",
        submissionDate: "2024-02-15",
        documents: [
          { name: "Protocolo", file: "protocolo_maria_2024.pdf", pages: 24, size: "2.4 MB" },
          { name: "Declaração do Supervisor", file: "declaracao_supervisor.pdf", pages: 1, size: "156 KB" },
          { name: "Curriculum Vitae", file: "cv_maria.pdf", pages: 3, size: "890 KB" }
        ],
        waitingTime: "3 dias"
      },
      {
        id: 102,
        protocolTitle: "Avaliação da Qualidade da Água para Consumo Humano em Bairros Periurbanos da Matola",
        student: "Pedro João Macie",
        studentNumber: "01.5021.2023",
        course: "Licenciatura em Saúde Ambiental",
        submissionDate: "2024-02-18",
        documents: [
          { name: "Protocolo", file: "protocolo_pedro_2024.pdf", pages: 18, size: "1.8 MB" },
          { name: "Carta de Apoio Institucional", file: "carta_apoio.pdf", pages: 2, size: "234 KB" }
        ],
        waitingTime: "1 dia"
      },
      {
        id: 103,
        protocolTitle: "Perfil Epidemiológico da Tuberculose Multirresistente na Cidade de Maputo, 2019-2023",
        student: "Ana Paula Sitoe",
        studentNumber: "02.3056.2022",
        course: "Mestrado em Epidemiologia",
        submissionDate: "2024-02-14",
        documents: [
          { name: "Protocolo", file: "protocolo_ana_2024.pdf", pages: 32, size: "3.1 MB" },
          { name: "Parecer do Comité de Ética", file: "parecer_etico.pdf", pages: 3, size: "567 KB" },
          { name: "Instrumentos de Recolha", file: "questionarios.pdf", pages: 8, size: "1.2 MB" }
        ],
        waitingTime: "4 dias",
        priority: "alta"
      }
    ],
    stats: {
      totalPendentes: 3,
      comPrioridade: 1,
      tempoMedioEspera: "2.7 dias"
    }
  },

  documentValidation: {
    validations: [
      {
        id: 201,
        protocolTitle: "Estudo sobre Desnutrição Crónica em Menores de 5 Anos na Zambézia",
        student: "Maria Alberto Muando",
        documentType: "Protocolo",
        documentName: "protocolo_maria_2024.pdf",
        validationCriteria: [
          { name: "Estrutura do documento", status: "ok", comment: "Formatação correta conforme normas ABNT" },
          { name: "Folha de rosto", status: "ok", comment: "Presente e assinada" },
          { name: "Resumo/Abstract", status: "warning", comment: "Abstract em inglês necessita revisão gramatical" },
          { name: "Referências bibliográficas", status: "error", comment: "Formato inconsistente. Usar APA 7ª edição" },
          { name: "Paginação", status: "ok", comment: null }
        ],
        overallStatus: "pendente_correcoes",
        submissionDate: "2024-02-15"
      },
      {
        id: 202,
        protocolTitle: "Avaliação da Qualidade da Água para Consumo Humano em Bairros Periurbanos da Matola",
        student: "Pedro João Macie",
        documentType: "Declaração do Supervisor",
        documentName: "declaracao_supervisor_pedro.pdf",
        validationCriteria: [
          { name: "Assinatura do supervisor", status: "error", comment: "Documento não está assinado digitalmente" },
          { name: "Identificação do supervisor", status: "ok", comment: null },
          { name: "Data", status: "ok", comment: null }
        ],
        overallStatus: "não aprovado",
        submissionDate: "2024-02-18"
      }
    ],
    stats: {
      totalPendentes: 2,
      aprovadosHoje: 5,
      rejeitadosHoje: 1,
      tempoMedioValidacao: "15 minutos"
    }
  },

  quickActions: {
    actions: [
      {
        id: "new-protocol",
        label: "Submeter Protocolo",
        icon: "post_add",
        color: "primary",
        description: "Iniciar novo processo de protocolo científico",
        path: "/protocols/new",
        enabled: true
      },
      {
        id: "my-documents",
        label: "Meus Documentos",
        icon: "folder",
        color: "secondary",
        description: "Acessar documentos submetidos",
        path: "/documents",
        enabled: true
      },
      {
        id: "review-queue",
        label: "Fila de Revisão",
        icon: "rate_review",
        color: "tertiary",
        description: "Protocolos aguardando sua revisão",
        path: "/reviews",
        enabled: true,
        badge: 3
      },
      {
        id: "schedule",
        label: "Calendário",
        icon: "calendar_month",
        color: "primary",
        description: "Ver calendário de defesas e prazos",
        path: "/calendar",
        enabled: true
      },
      {
        id: "messages",
        label: "Mensagens",
        icon: "chat",
        color: "secondary",
        description: "Comunicações com orientador/revisores",
        path: "/messages",
        enabled: true,
        badge: 2
      }
    ]
  },

  // ========================
  // REVISÕES
  // ========================
  
  pendingReviews: {
    reviews: [
      {
        id: 301,
        protocolTitle: "Avaliação da Eficácia de Plantas Medicinais no Tratamento da Malária em Crianças Menores de 5 Anos",
        student: "Carlos Alberto Matusse",
        course: "Licenciatura em Medicina Geral",
        assignedDate: "2024-01-20",
        deadline: "2024-02-20",
        daysRemaining: 5,
        priority: "alta",
        type: "revisao_metodologica",
        protocolSummary: "Estudo randomizado controlado sobre eficácia de plantas medicinais tradicionais...",
        documents: [
          { name: "Protocolo", url: "#" },
          { name: "Revisão de Literatura", url: "#" }
        ]
      },
      {
        id: 302,
        protocolTitle: "Impacto da Suplementação com Vitamina A na Redução da Morbidade por Doenças Diarreicas",
        student: "Lucia Francisco Mandlate",
        course: "Mestrado em Saúde Pública",
        assignedDate: "2024-02-01",
        deadline: "2024-03-01",
        daysRemaining: 15,
        priority: "media",
        type: "revisao_etica",
        protocolSummary: "Estudo de coorte sobre suplementação de vitamina A em crianças...",
        documents: [
          { name: "Protocolo", url: "#" },
          { name: "Termo de Consentimento", url: "#" }
        ]
      },
      {
        id: 303,
        protocolTitle: "Prevalência de Hipertensão Arterial e Fatores de Risco em Adultos na Cidade de Maputo",
        student: "Fernando José Cuamba",
        course: "Licenciatura em Enfermagem",
        assignedDate: "2024-01-25",
        deadline: "2024-02-25",
        daysRemaining: 10,
        priority: "media",
        type: "revisao_metodologica",
        protocolSummary: "Estudo transversal sobre prevalência de hipertensão...",
        documents: [
          { name: "Protocolo", url: "#" },
          { name: "Questionário", url: "#" }
        ]
      }
    ],
    stats: {
      totalPendentes: 3,
      prioridadeAlta: 1,
      prazoMedio: "10 dias",
      revisoesCompletadasMes: 8
    }
  },

  reviewerAssignment: {
    availableReviewers: [
      {
        id: 1,
        name: "Prof. Doutor Armando Macuácua",
        department: "Departamento de Ciências Biomédicas",
        specialization: ["Farmacologia", "Medicina Tropical", "Fitoterapia"],
        currentLoad: 3,
        maxLoad: 5,
        availability: "disponivel",
        completedReviews: 45,
        averageRating: 4.8,
        lastReviewDate: "2024-02-10"
      },
      {
        id: 2,
        name: "Dra. Carla Mondlane",
        department: "Departamento de Saúde Pública",
        specialization: ["Epidemiologia", "Bioestatística", "Nutrição"],
        currentLoad: 5,
        maxLoad: 5,
        availability: "sobrecarregado",
        completedReviews: 32,
        averageRating: 4.6,
        lastReviewDate: "2024-02-15"
      },
      {
        id: 3,
        name: "Prof. Doutora Ana Mussa",
        department: "Departamento de Enfermagem",
        specialization: ["Enfermagem Comunitária", "Saúde Materno-Infantil"],
        currentLoad: 2,
        maxLoad: 5,
        availability: "disponivel",
        completedReviews: 28,
        averageRating: 4.9,
        lastReviewDate: "2024-01-28"
      },
      {
        id: 4,
        name: "Dr. João Zimba",
        department: "Departamento de Medicina",
        specialization: ["Medicina Interna", "Cardiologia"],
        currentLoad: 4,
        maxLoad: 5,
        availability: "disponivel",
        completedReviews: 38,
        averageRating: 4.7,
        lastReviewDate: "2024-02-12"
      }
    ],
    unassignedProtocols: [
      {
        id: 401,
        title: "Estudo sobre Desnutrição Crónica em Menores de 5 Anos na Zambézia",
        student: "Maria Alberto Muando",
        course: "Licenciatura em Nutrição",
        submissionDate: "2024-02-15",
        methodologyType: "quantitativa",
        requiredSpecializations: ["Nutrição", "Epidemiologia", "Pediatria"],
        reviewersNeeded: 2,
        suggestedReviewers: [2, 3]
      },
      {
        id: 402,
        title: "Perfil Epidemiológico da Tuberculose Multirresistente na Cidade de Maputo",
        student: "Ana Paula Sitoe",
        course: "Mestrado em Epidemiologia",
        submissionDate: "2024-02-14",
        methodologyType: "mista",
        requiredSpecializations: ["Epidemiologia", "Pneumologia", "Saúde Pública"],
        reviewersNeeded: 2,
        suggestedReviewers: [1, 2]
      }
    ],
    recentAssignments: [
      {
        id: 501,
        protocolTitle: "Prevalência de Hipertensão Arterial em Adultos",
        reviewers: ["Dr. João Zimba", "Prof. Doutora Ana Mussa"],
        assignedBy: "Secretária Académica",
        assignedDate: "2024-02-18",
        status: "em_andamento"
      }
    ]
  },

  workloadView: {
    reviewers: [
      {
        id: 1,
        name: "Prof. Doutor Armando Macuácua",
        department: "Ciências Biomédicas",
        assignedReviews: 3,
        completedThisMonth: 2,
        averageCompletionDays: 12,
        currentLoad: 60,
        reviews: [
          { id: 301, protocol: "Eficácia de Plantas Medicinais na Malária", deadline: "2024-02-20", daysLeft: 5 },
          { id: 304, protocol: "Tuberculose Multirresistente em Maputo", deadline: "2024-03-05", daysLeft: 20 },
          { id: 305, protocol: "Saúde Mental em Adolescentes", deadline: "2024-03-10", daysLeft: 25 }
        ]
      },
      {
        id: 2,
        name: "Dra. Carla Mondlane",
        department: "Saúde Pública",
        assignedReviews: 5,
        completedThisMonth: 3,
        averageCompletionDays: 15,
        currentLoad: 100,
        reviews: [
          { id: 302, protocol: "Suplementação com Vitamina A", deadline: "2024-03-01", daysLeft: 15 },
          { id: 306, protocol: "Qualidade da Água na Matola", deadline: "2024-02-28", daysLeft: 13 },
          { id: 307, protocol: "Cobertura Vacinal em Gaza", deadline: "2024-03-15", daysLeft: 30 }
        ]
      }
    ],
    departmentStats: {
      totalReviewers: 12,
      averageLoad: 72,
      overloadedReviewers: 3,
      availableReviewers: 5,
      totalPendingReviews: 23
    }
  },

  // ========================
  // AVALIAÇÕES
  // ========================
  
  pendingEvaluations: {
    evaluations: [
      {
        id: 601,
        protocolTitle: "Avaliação da Eficácia de Plantas Medicinais no Tratamento da Malária",
        student: "Carlos Alberto Matusse",
        formType: "Formulário A - Revisão Metodológica",
        assignedDate: "2024-01-20",
        deadline: "2024-02-20",
        daysRemaining: 5,
        status: "nao_iniciada",
        criteria: [
          { name: "Relevância Científica", weight: 20, maxScore: 5 },
          { name: "Metodologia", weight: 30, maxScore: 5 },
          { name: "Viabilidade", weight: 15, maxScore: 5 },
          { name: "Aspectos Éticos", weight: 20, maxScore: 5 },
          { name: "Referencial Teórico", weight: 15, maxScore: 5 }
        ]
      },
      {
        id: 602,
        protocolTitle: "Prevalência de Hipertensão Arterial em Adultos na Cidade de Maputo",
        student: "Fernando José Cuamba",
        formType: "Formulário B - Revisão Ética",
        assignedDate: "2024-01-25",
        deadline: "2024-02-25",
        daysRemaining: 10,
        status: "em_progresso",
        progress: 60,
        criteria: [
          { name: "Consentimento Informado", weight: 30, maxScore: 5 },
          { name: "Proteção de Dados", weight: 25, maxScore: 5 },
          { name: "Risco/Benefício", weight: 25, maxScore: 5 },
          { name: "Vulnerabilidade", weight: 20, maxScore: 5 }
        ]
      }
    ]
  },

  evaluationResults: {
    completedEvaluations: [
      {
        id: 701,
        protocolTitle: "Análise da Cobertura Vacinal contra o Sarampo em Gaza",
        student: "Teresa João Nhabinde",
        evaluationDate: "2024-01-28",
        finalScore: 4.2,
        maxScore: 5,
        decision: "aprovado_com_ressalvas",
        decisionLabel: "Aprovado com Ressalvas",
        decisionColor: "warning",
        reviewer: "Prof. Doutora Ana Mussa",
        criteria: [
          { name: "Relevância", score: 5, maxScore: 5, comment: "Tema extremamente relevante para saúde pública" },
          { name: "Metodologia", score: 4, maxScore: 5, comment: "Metodologia adequada, mas amostra poderia ser maior" },
          { name: "Viabilidade", score: 4, maxScore: 5, comment: "Viável, mas necessita de mais tempo de campo" },
          { name: "Aspectos Éticos", score: 5, maxScore: 5, comment: "Todos aspectos éticos contemplados" },
          { name: "Referencial Teórico", score: 3, maxScore: 5, comment: "Necessita atualização bibliográfica" }
        ],
        comments: "Protocolo bem estruturado. Recomenda-se ampliar a revisão de literatura com artigos dos últimos 5 anos e justificar melhor o tamanho amostral."
      },
      {
        id: 702,
        protocolTitle: "Impacto da Suplementação com Vitamina A em Crianças",
        student: "Lucia Francisco Mandlate",
        evaluationDate: "2024-02-05",
        finalScore: 4.8,
        maxScore: 5,
        decision: "aprovado",
        decisionLabel: "Aprovado",
        decisionColor: "success",
        reviewer: "Dr. João Zimba",
        criteria: [
          { name: "Relevância", score: 5, maxScore: 5, comment: "Excelente relevância para políticas de saúde" },
          { name: "Metodologia", score: 5, maxScore: 5, comment: "Desenho metodológico robusto" },
          { name: "Viabilidade", score: 4, maxScore: 5, comment: "Viável com recursos disponíveis" },
          { name: "Aspectos Éticos", score: 5, maxScore: 5, comment: "Protocolo ético exemplar" },
          { name: "Referencial Teórico", score: 5, maxScore: 5, comment: "Revisão abrangente e atualizada" }
        ],
        comments: "Protocolo exemplar. Demonstra domínio da metodologia científica e relevância para saúde pública."
      }
    ],
    stats: {
      totalAvaliacoes: 12,
      mediaGeral: 4.3,
      aprovados: 8,
      aprovadosComRessalvas: 3,
      reprovados: 1
    }
  },

  // ========================
  // DEFESAS
  // ========================
  
  defenseSchedule: {
    upcomingDefenses: [
      {
        id: 801,
        protocolTitle: "Prevalência de Doenças Crónicas Não Transmissíveis em Idosos na Cidade de Maputo",
        student: "Isabel dos Santos Tembe",
        course: "Mestrado em Saúde Pública",
        date: "2024-03-15",
        time: "09:00",
        location: "Sala de Defesas - Bloco A",
        mode: "presencial",
        jury: [
          { name: "Prof. Doutor Armando Macuácua", role: "Presidente" },
          { name: "Dra. Carla Mondlane", role: "Arguente Principal" },
          { name: "Dr. João Zimba", role: "Arguente" },
          { name: "Prof. Doutora Ana Mussa", role: "Orientadora" }
        ],
        status: "confirmada",
        documents: ["protocolo_final.pdf", "parecer_etico.pdf"]
      },
      {
        id: 802,
        protocolTitle: "Avaliação da Qualidade dos Serviços de Saúde Materno-Infantil em Unidades Sanitárias da Província de Inhambane",
        student: "Rosa Armando Guamba",
        course: "Doutoramento em Saúde Pública",
        date: "2024-03-22",
        time: "14:00",
        location: "Auditório Principal",
        mode: "hibrido",
        streamingLink: "https://iscisa.ac.mz/defesas/stream/802",
        jury: [
          { name: "Prof. Doutor João Schwalbach", role: "Presidente" },
          { name: "Prof. Doutora Ana Mussa", role: "Arguente Principal" },
          { name: "Dra. Carla Mondlane", role: "Co-orientadora" }
        ],
        status: "agendada",
        documents: ["tese_final.pdf"]
      },
      {
        id: 803,
        protocolTitle: "Impacto das Mudanças Climáticas na Incidência de Malária em Moçambique",
        student: "Alberto Francisco Cuna",
        course: "Licenciatura em Saúde Ambiental",
        date: "2024-04-05",
        time: "10:00",
        location: "Sala Virtual - Teams",
        mode: "online",
        streamingLink: "https://teams.microsoft.com/defesa/803",
        jury: [
          { name: "Dr. João Zimba", role: "Presidente" },
          { name: "Prof. Doutor Armando Macuácua", role: "Arguente" }
        ],
        status: "pendente_confirmacao",
        documents: ["monografia_final.pdf"]
      }
    ],
    calendar: {
      currentMonth: "Março 2024",
      totalDefenses: 8,
      presencial: 4,
      online: 3,
      hibrido: 1
    }
  },

  juryParticipation: {
    participations: [
      {
        id: 901,
        protocolTitle: "Prevalência de Doenças Crónicas em Idosos",
        student: "Isabel dos Santos Tembe",
        role: "Presidente",
        date: "2024-03-15",
        time: "09:00",
        location: "Sala de Defesas - Bloco A",
        documents: ["protocolo_final.pdf"],
        status: "confirmada",
        preparationDeadline: "2024-03-08"
      },
      {
        id: 902,
        protocolTitle: "Avaliação da Qualidade da Água em Bairros Periurbanos",
        student: "Pedro João Macie",
        role: "Arguente",
        date: "2024-04-10",
        time: "14:00",
        location: "Sala Virtual - Zoom",
        documents: ["monografia.pdf", "avaliacao_previa.pdf"],
        status: "pendente",
        preparationDeadline: "2024-04-03"
      }
    ],
    stats: {
      totalParticipacoesAno: 5,
      comoPresidente: 2,
      comoArguente: 3,
      proximaDefesa: "2024-03-15"
    }
  },

  // ========================
  // SUPERVISÃO
  // ========================
  
  supervisionStudents: {
    students: [
      {
        id: 1001,
        name: "Carlos Alberto Matusse",
        studentNumber: "01.3045.2023",
        course: "Licenciatura em Medicina Geral",
        protocolTitle: "Avaliação da Eficácia de Plantas Medicinais no Tratamento da Malária",
        protocolStatus: "em_revisao",
        protocolStatusLabel: "Em Revisão",
        enrollmentYear: 2023,
        expectedCompletion: "2024-06",
        meetings: [
          { date: "2024-02-10", type: "presencial", topic: "Revisão do protocolo", duration: "1h30min" },
          { date: "2024-01-15", type: "online", topic: "Definição da metodologia", duration: "1h" }
        ],
        nextMeeting: "2024-02-28",
        documents: [
          { name: "Protocolo v2", date: "2024-02-01", status: "enviado" },
          { name: "Revisão de Literatura", date: "2024-01-20", status: "revisado" }
        ],
        progress: 65,
        alerts: ["Prazo de entrega se aproxima", "Necessita revisão metodológica"]
      },
      {
        id: 1002,
        name: "Lucia Francisco Mandlate",
        studentNumber: "02.4012.2023",
        course: "Mestrado em Saúde Pública",
        protocolTitle: "Impacto da Suplementação com Vitamina A em Crianças",
        protocolStatus: "aprovado",
        protocolStatusLabel: "Aprovado",
        enrollmentYear: 2023,
        expectedCompletion: "2024-08",
        meetings: [
          { date: "2024-02-12", type: "presencial", topic: "Preparação para campo", duration: "2h" },
          { date: "2024-01-20", type: "online", topic: "Análise estatística", duration: "1h30min" }
        ],
        nextMeeting: "2024-03-05",
        documents: [
          { name: "Protocolo Final", date: "2024-01-15", status: "aprovado" },
          { name: "Instrumentos de Recolha", date: "2024-02-01", status: "revisado" }
        ],
        progress: 85,
        alerts: []
      },
      {
        id: 1003,
        name: "Fernando José Cuamba",
        studentNumber: "01.5028.2023",
        course: "Licenciatura em Enfermagem",
        protocolTitle: "Prevalência de Hipertensão Arterial em Adultos",
        protocolStatus: "triagem",
        protocolStatusLabel: "Em Triagem",
        enrollmentYear: 2023,
        expectedCompletion: "2024-12",
        meetings: [
          { date: "2024-02-05", type: "presencial", topic: "Definição do tema", duration: "1h" }
        ],
        nextMeeting: "2024-02-25",
        documents: [
          { name: "Protocolo Preliminar", date: "2024-02-01", status: "em_revisao" }
        ],
        progress: 25,
        alerts: ["Protocolo ainda não submetido formalmente"]
      }
    ],
    stats: {
      totalTutorandos: 5,
      ativos: 3,
      concluidos: 2,
      mediaProgresso: 58
    }
  },

  // ========================
  // RELATÓRIOS & BI
  // ========================
  
  protocolStats: {
    overview: {
      totalProtocolos: 156,
      mesAtual: 12,
      mesAnterior: 8,
      variacao: "+50%"
    },
    byStatus: [
      { status: "Em Triagem", count: 23, color: "info", percentage: 14.7 },
      { status: "Em Revisão", count: 45, color: "warning", percentage: 28.8 },
      { status: "Aprovados", count: 67, color: "success", percentage: 42.9 },
      { status: "Não Aprovados", count: 21, color: "error", percentage: 13.5 }
    ],
    byCourse: [
      { course: "Medicina Geral", count: 42, percentage: 26.9 },
      { course: "Enfermagem", count: 35, percentage: 22.4 },
      { course: "Farmácia", count: 28, percentage: 17.9 },
      { course: "Nutrição", count: 20, percentage: 12.8 },
      { course: "Saúde Ambiental", count: 18, percentage: 11.5 },
      { course: "Mestrado em Saúde Pública", count: 13, percentage: 8.3 }
    ],
    byMonth: [
      { month: "Set/2023", submetidos: 8, aprovados: 6, rejeitados: 2 },
      { month: "Out/2023", submetidos: 12, aprovados: 9, rejeitados: 3 },
      { month: "Nov/2023", submetidos: 10, aprovados: 8, rejeitados: 2 },
      { month: "Dez/2023", submetidos: 15, aprovados: 11, rejeitados: 4 },
      { month: "Jan/2024", submetidos: 18, aprovados: 14, rejeitados: 4 },
      { month: "Fev/2024", submetidos: 12, aprovados: 8, rejeitados: 2 }
    ],
    averageTimeByPhase: [
      { phase: "Triagem", days: 3.5 },
      { phase: "Revisão Metodológica", days: 12.8 },
      { phase: "Revisão Ética", days: 8.2 },
      { phase: "Avaliação Final", days: 5.1 }
    ],
    topSupervisors: [
      { name: "Prof. Doutor Armando Macuácua", protocols: 12, approvalRate: 92 },
      { name: "Dra. Carla Mondlane", protocols: 10, approvalRate: 85 },
      { name: "Prof. Doutora Ana Mussa", protocols: 9, approvalRate: 95 },
      { name: "Dr. João Zimba", protocols: 8, approvalRate: 88 }
    ]
  },

  reportsPanel: {
    availableReports: [
      {
        id: "report-1",
        title: "Relatório Mensal de Protocolos",
        description: "Resumo de todos os protocolos submetidos, aprovados e não aprovados no mês",
        lastGenerated: "2024-02-01",
        format: "PDF",
        parameters: ["mês", "ano", "curso"]
      },
      {
        id: "report-2",
        title: "Desempenho dos Revisores",
        description: "Métricas de desempenho dos revisores: tempo médio, quantidade, notas",
        lastGenerated: "2024-01-15",
        format: "Excel",
        parameters: ["período", "departamento"]
      },
      {
        id: "report-3",
        title: "Taxa de Sucesso por Curso",
        description: "Percentual de aprovação de protocolos por curso",
        lastGenerated: "2024-01-10",
        format: "PDF",
        parameters: ["ano letivo", "semestre"]
      },
      {
        id: "report-4",
        title: "Relatório de Defesas",
        description: "Calendário e resultados das defesas realizadas",
        lastGenerated: "2024-02-05",
        format: "PDF",
        parameters: ["mês", "ano", "modalidade"]
      },
      {
        id: "report-5",
        title: "Indicadores de Produção Científica",
        description: "KPIs de produção científica institucional",
        lastGenerated: "2024-01-30",
        format: "PowerBI",
        parameters: ["ano", "departamento"]
      }
    ],
    recentDownloads: [
      { report: "Relatório Mensal - Janeiro 2024", downloadedBy: "Director Científico", date: "2024-02-02" },
      { report: "Desempenho Revisores - 2023", downloadedBy: "Coordenador Académico", date: "2024-01-20" }
    ]
  },

  // ========================
  // ADMINISTRAÇÃO
  // ========================
  
  adminPanel: {
    systemOverview: {
      totalUsers: 234,
      activeUsers: 198,
      newUsersThisMonth: 12,
      totalRoles: 7,
      totalOrgans: 5,
      totalCourses: 8,
      systemVersion: "2.1.0",
      lastBackup: "2024-02-19 23:00",
      uptime: "99.9%"
    },
    userManagement: {
      recentRegistrations: [
        { name: "Maria Alberto Muando", role: "student", date: "2024-02-15", status: "active" },
        { name: "Pedro João Macie", role: "student", date: "2024-02-18", status: "active" },
        { name: "Dra. Sara Mondlane", role: "supervisor", date: "2024-02-10", status: "pending_verification" }
      ],
      pendingApprovals: 3,
      suspendedAccounts: 2
    },
    auditLog: [
      { action: "Login", user: "admin@iscisa.ac.mz", timestamp: "2024-02-19 14:30", ip: "192.168.1.100" },
      { action: "Atribuição de Revisor", user: "secretaria@iscisa.ac.mz", timestamp: "2024-02-19 13:15", details: "Protocolo #401" },
      { action: "Aprovação de Protocolo", user: "supervisor@iscisa.ac.mz", timestamp: "2024-02-19 11:45", details: "Protocolo #301" },
      { action: "Criação de Usuário", user: "admin@iscisa.ac.mz", timestamp: "2024-02-19 10:00", details: "Usuário: maria@iscisa.ac.mz" }
    ],
    systemHealth: {
      databaseSize: "256 MB",
      storageUsage: "45%",
      activeSessions: 23,
      errorRate: "0.02%",
      averageResponseTime: "120ms"
    }
  },

  // ========================
  // GERAL
  // ========================
  
  notifications: {
    notifications: [
      {
        id: 10001,
        type: "review_assigned",
        title: "Nova Revisão Atribuída",
        message: "Você foi designado para revisar o protocolo 'Avaliação da Eficácia de Plantas Medicinais'",
        timestamp: "2024-02-19 14:00",
        read: false,
        priority: "high",
        actionUrl: "/reviews/301",
        icon: "rate_review"
      },
      {
        id: 10002,
        type: "deadline_warning",
        title: "Prazo de Revisão se Aproxima",
        message: "A revisão do protocolo #301 deve ser concluída até 20/02/2024 (5 dias restantes)",
        timestamp: "2024-02-19 08:00",
        read: false,
        priority: "high",
        actionUrl: "/reviews/301",
        icon: "warning"
      },
      {
        id: 10003,
        type: "protocol_approved",
        title: "Protocolo Aprovado",
        message: "Seu protocolo 'Prevalência de Hipertensão' foi aprovado pela comissão científica",
        timestamp: "2024-02-18 16:30",
        read: true,
        priority: "normal",
        actionUrl: "/protocols/3",
        icon: "check_circle"
      },
      {
        id: 10004,
        type: "meeting_scheduled",
        title: "Reunião com Orientador",
        message: "Dr. João Zimba agendou uma reunião para 25/02/2024 às 10:00",
        timestamp: "2024-02-18 11:00",
        read: true,
        priority: "normal",
        actionUrl: "/calendar",
        icon: "event"
      },
      {
        id: 10005,
        type: "system",
        title: "Manutenção do Sistema",
        message: "O sistema estará indisponível para manutenção no dia 25/02/2024 das 22:00 às 02:00",
        timestamp: "2024-02-17 09:00",
        read: true,
        priority: "low",
        actionUrl: null,
        icon: "info"
      }
    ],
    unreadCount: 2,
    totalCount: 5
  },

  deadlines: {
    deadlines: [
      {
        id: 2001,
        title: "Prazo Final para Revisão #301",
        description: "Revisão metodológica do protocolo sobre Plantas Medicinais",
        date: "2024-02-20",
        daysRemaining: 1,
        priority: "critical",
        type: "review",
        icon: "rate_review"
      },
      {
        id: 2002,
        title: "Submissão de Protocolos para Defesa",
        description: "Prazo para submissão de protocolos aprovados para agendamento de defesa",
        date: "2024-03-01",
        daysRemaining: 12,
        priority: "high",
        type: "submission",
        icon: "post_add"
      },
      {
        id: 2003,
        title: "Entrega de Parecer Ético",
        description: "Data limite para submissão do parecer do comité de ética",
        date: "2024-03-10",
        daysRemaining: 21,
        priority: "medium",
        type: "document",
        icon: "description"
      },
      {
        id: 2004,
        title: "Defesa de Mestrado - Saúde Pública",
        description: "Prevalência de Doenças Crónicas em Idosos",
        date: "2024-03-15",
        daysRemaining: 26,
        priority: "normal",
        type: "defense",
        icon: "gavel"
      },
      {
        id: 2005,
        title: "Fim do Semestre Letivo",
        description: "Encerramento das atividades letivas do 1º semestre",
        date: "2024-06-30",
        daysRemaining: 133,
        priority: "low",
        type: "academic",
        icon: "school"
      }
    ],
    upcomingCount: 8,
    criticalCount: 1
  }
};
