// mocks/monographData.ts

export const mockMonographData = {
  monographs: [
    {
      id: 1,
      code: "MONO-2024-001",
      title: "Avaliação da Eficácia de Plantas Medicinais no Tratamento da Malária em Crianças Menores de 5 Anos na Província de Nampula",
      status: "monograph_in_review",
      status_label: "Em Revisão",
      submission_number: 1,
      version: 1,
      documents: [
        {
          id: 1,
          file_name: "Monografia_Carlos_Matusse_2024.docx",
          version: 1,
          status: "active",
          download_url: "/api/monographs/1/documents/1/download",
          created_at: "2024-06-15"
        }
      ],
      created_at: "2024-06-15",
      updated_at: "2024-06-20"
    },
    {
      id: 2,
      code: "MONO-2024-002",
      title: "Impacto da Suplementação com Vitamina A na Redução da Morbidade por Doenças Diarreicas",
      status: "monograph_approved_nucleo",
      status_label: "Aprovada",
      submission_number: 1,
      version: 2,
      documents: [
        {
          id: 2,
          file_name: "Monografia_Lucia_Mandlate_2024_v2.docx",
          version: 2,
          status: "active",
          download_url: "/api/monographs/2/documents/2/download",
          created_at: "2024-07-01"
        }
      ],
      created_at: "2024-06-20",
      updated_at: "2024-07-05"
    }
  ]
}

export const mockMonographOpinions = {
  1: [
    {
      id: 1,
      organ: "Núcleo de Investigação",
      decision: "approved",
      version: 1,
      download_url: "/api/monographs/1/opinions/1/download",
      evaluation_form_download_url: "/api/monographs/1/opinions/1/form/download",
      created_at: "2024-06-25"
    }
  ],
  2: [
    {
      id: 2,
      organ: "Supervisor",
      decision: "approved",
      version: 1,
      download_url: "/api/monographs/2/opinions/2/download",
      evaluation_form_download_url: "/api/monographs/2/opinions/2/form/download",
      created_at: "2024-06-28"
    },
    {
      id: 3,
      organ: "Núcleo de Investigação",
      decision: "approved",
      version: 2,
      download_url: "/api/monographs/2/opinions/3/download",
      evaluation_form_download_url: "/api/monographs/2/opinions/3/form/download",
      created_at: "2024-07-05"
    }
  ]
}