// src/components/protocol/protocolStatusMap.ts

export type OrganKey = 'nucleo' | 'comite_cientifico' | 'comite_bioetica' | 'final';

export type StageState =
  | 'not_started'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'current';

export interface OrganStage {
  key: OrganKey;
  label: string;
  shortLabel: string;
  icon: string;
  state: StageState;
  version: string | null;
  detail?: string;
}

export interface PipelineInput {
  status: string;
  version?: string | null;
  nc_version?: number | null;
  cc_version?: number | null;
  cb_version?: number | null;
}

const PENDING_NUCLEO = 'protocol_pending_nucleo';
const IN_REVIEW_NUCLEO = 'protocol_in_review_nucleo';

const PENDING_CC = 'protocol_pending_comite_cientifico';
const IN_REVIEW_CC = 'protocol_in_review_comite_cientifico';
const DOCS_PENDING_CC = 'protocol_documents_pending_cc';

const PENDING_CB = 'protocol_pending_comite_bioetica';
const IN_REVIEW_CB = 'protocol_in_review_comite_bioetica';

const APPROVED_FINAL = 'protocol_approved_final';
const REJECTED_FINAL = 'protocol_rejected_final';

const PENDING_SUPERVISOR = 'protocol_pending_supervisor';
const REJECTED_SUPERVISOR = 'protocol_rejected_supervisor';

function formatVersion(prefix: string, value?: number | null): string | null {
  if (value === null || value === undefined || Number(value) <= 0) return null;
  const n = Math.max(1, Number(value));
  return `${prefix}${n}`;
}

export function buildPipeline(protocol: PipelineInput): OrganStage[] {
  const status = protocol.status ?? '';

  const isRejectedAtSupervisor = status === REJECTED_SUPERVISOR;
  const isRejectedFinal = status === REJECTED_FINAL;
  const isApprovedFinal = status === APPROVED_FINAL;

  const atNucleoPending = status === PENDING_NUCLEO || status === PENDING_SUPERVISOR;
  const atNucleoReview = status === IN_REVIEW_NUCLEO;

  const atCcPending = status === PENDING_CC || status === DOCS_PENDING_CC;
  const atCcReview = status === IN_REVIEW_CC;

  const atCbPending = status === PENDING_CB;
  const atCbReview = status === IN_REVIEW_CB;

  const nucleoVersion = formatVersion('NC_V', protocol.nc_version);
  const ccVersion = formatVersion('CC_V', protocol.cc_version);
  const cbVersion = formatVersion('CIBS_V', protocol.cb_version);

  const rejectedHere = isRejectedFinal || isRejectedAtSupervisor;

  let nucleoState: StageState = 'not_started';
  if (isRejectedAtSupervisor) {
    nucleoState = 'rejected';
  } else if (
    isApprovedFinal ||
    atCcPending || atCcReview || atCbPending || atCbReview
  ) {
    nucleoState = 'approved';
  } else if (atNucleoPending) {
    nucleoState = 'current';
  } else if (atNucleoReview) {
    nucleoState = 'current';
  }

  let ccState: StageState = 'not_started';
  if (isApprovedFinal || atCbPending || atCbReview) {
    ccState = 'approved';
  } else if (isRejectedFinal) {
    ccState = 'rejected';
  } else if (atCcPending) {
    ccState = 'current';
  } else if (atCcReview) {
    ccState = 'current';
  }

  let cbState: StageState = 'not_started';
  if (isApprovedFinal) {
    cbState = 'approved';
  } else if (isRejectedFinal) {
    cbState = 'rejected';
  } else if (atCbPending) {
    cbState = 'current';
  } else if (atCbReview) {
    cbState = 'current';
  }

  let finalState: StageState = 'not_started';
  if (isApprovedFinal) {
    finalState = 'approved';
  } else if (isRejectedFinal || isRejectedAtSupervisor) {
    finalState = 'rejected';
  }

  if (rejectedHere) {
    if (nucleoState !== 'rejected' && nucleoState !== 'approved') {
      nucleoState = nucleoState === 'not_started' ? 'not_started' : nucleoState;
    }
  }

  const nucleoDetail = getNucleoDetail(status, nucleoState);
  const ccDetail = getCcDetail(status, ccState);
  const cbDetail = getCbDetail(status, cbState);
  const finalDetail = getFinalDetail(finalState);

  return [
    {
      key: 'nucleo',
      label: 'Núcleo Científico',
      shortLabel: 'Núcleo',
      icon: 'biotech',
      state: nucleoState,
      version: nucleoVersion,
      detail: nucleoDetail,
    },
    {
      key: 'comite_cientifico',
      label: 'Comité Científico',
      shortLabel: 'Comité Cient.',
      icon: 'science',
      state: ccState,
      version: ccVersion,
      detail: ccDetail,
    },
    {
      key: 'comite_bioetica',
      label: 'Comité de Bioética',
      shortLabel: 'Bioética',
      icon: 'health_and_safety',
      state: cbState,
      version: cbVersion,
      detail: cbDetail,
    },
    {
      key: 'final',
      label: 'Aprovação Final',
      shortLabel: 'Final',
      icon: 'verified',
      state: finalState,
      version: isApprovedFinal ? 'APROVADO' : null,
      detail: finalDetail,
    },
  ];
}

function getNucleoDetail(status: string, state: StageState): string {
  if (state === 'approved') return 'Aprovado pelo Núcleo';
  if (state === 'rejected') return 'Rejeitado';
  if (state === 'in_review' || status === IN_REVIEW_NUCLEO) return 'Em avaliação no Núcleo';
  if (state === 'pending' || status === PENDING_NUCLEO) return 'Aguardando atribuição de revisores';
  if (state === 'current' && status === PENDING_SUPERVISOR) return 'Aguardando aval do supervisor';
  if (state === 'not_started') return 'Ainda não submetido ao Núcleo';
  return '—';
}

function getCcDetail(status: string, state: StageState): string {
  if (state === 'approved') return 'Aprovado pelo Comité Científico';
  if (state === 'rejected') return 'Rejeitado';
  if (status === DOCS_PENDING_CC) return 'Aguardando documentos do estudante';
  if (status === IN_REVIEW_CC) return 'Em avaliação no Comité Científico';
  if (state === 'pending' || status === PENDING_CC) return 'Aguardando atribuição de revisores';
  if (state === 'not_started') return 'Ainda não chegou ao Comité';
  return '—';
}

function getCbDetail(status: string, state: StageState): string {
  if (state === 'approved') return 'Aprovado pelo Comité de Bioética';
  if (state === 'rejected') return 'Rejeitado';
  if (status === IN_REVIEW_CB) return 'Em avaliação no Comité de Bioética';
  if (state === 'pending' || status === PENDING_CB) return 'Aguardando atribuição de revisores';
  if (state === 'not_started') return 'Ainda não chegou ao Comité de Bioética';
  return '—';
}

function getFinalDetail(state: StageState): string {
  if (state === 'approved') return 'Protocolo aprovado para campo';
  if (state === 'rejected') return 'Processo encerrado';
  if (state === 'not_started') return 'Pendente conclusão do fluxo';
  return '—';
}

export function getOrganLabel(organ: string | null | undefined): string {
  switch (organ) {
    case 'nucleo':
    case 'nucleus':
      return 'Núcleo Científico';
    case 'comite_cientifico':
    case 'scientific_committee':
      return 'Comité Científico';
    case 'comite_bioetica':
    case 'bioethics_committee':
      return 'Comité de Bioética';
    default:
      return '—';
  }
}
