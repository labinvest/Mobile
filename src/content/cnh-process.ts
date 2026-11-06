/**
 * Conteúdo informativo sobre o processo da CNH, separado da interface.
 *
 * Regras de habilitação dependem do CONTRAN e do Detran de cada estado e mudam com frequência.
 * Por isso este arquivo NÃO traz cargas horárias mínimas, prazos nem lista de documentos: só a
 * ordem geral das etapas. Ao atualizar, revise a fonte oficial e a data abaixo.
 */
export const CNH_CONTENT_REVIEWED_AT = '2026-11-06';
export const CNH_OFFICIAL_SOURCE = 'https://www.gov.br/transportes/pt-br';

export type CnhStepId = 'opening' | 'exams' | 'theory' | 'practice' | 'driving-test';

export const CNH_STEPS: { id: CnhStepId; title: string; description: string }[] = [
  { id: 'opening', title: 'Abertura do processo', description: 'Feita junto ao Detran do seu estado.' },
  { id: 'exams', title: 'Exames médico e psicológico', description: 'Realizados em clínicas credenciadas.' },
  { id: 'theory', title: 'Curso e prova teórica', description: 'Legislação, direção defensiva e primeiros socorros.' },
  { id: 'practice', title: 'Aulas práticas', description: 'Com instrutor habilitado. É aqui que o Rota te acompanha.' },
  { id: 'driving-test', title: 'Prova prática', description: 'Agendada pelo Detran depois das aulas.' },
];

export const CNH_DISCLAIMER = 'As exigências variam por estado e podem mudar. Confirme sempre no Detran ou no portal do governo.';
