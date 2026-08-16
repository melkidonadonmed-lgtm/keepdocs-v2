import { FormTemplate } from "../types";

export const INITIAL_TEMPLATES: FormTemplate[] = [
  {
    id: "contract_prestacao_servicos",
    title: "Contrato de Prestação de Serviços",
    category: "Jurídico & Negócios",
    description: "Template automático para contratos de consultoria, desenvolvimento ou design.",
    templateContent: `<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS</h1>

<p><strong>CONTRATANTE:</strong> {{NOME_CONTRATANTE}}, inscrito sob CPF/CNPJ {{CPF_CNPJ_CONTRATANTE}}, com endereço em {{ENDERECO_CONTRATANTE}}.</p>

<p><strong>CONTRATADO:</strong> {{NOME_CONTRATADO}}, inscrito sob CPF/CNPJ {{CPF_CNPJ_CONTRATADO}}.</p>

<h3>1. DO OBJETO DO CONTRATO</h3>
<p>O presente contrato tem por objeto a prestação dos seguintes serviços: {{DESCRICAO_SERVICOS}}.</p>

<h3>2. DO VALOR E CONDICIONAMENTO DE PAGAMENTO</h3>
<p>Pela prestação dos serviços acordados, o CONTRATANTE pagará ao CONTRATADO a quantia total de <strong>{{VALOR_TOTAL}}</strong>, com vencimento previsto para <strong>{{DATA_VENCIMENTO}}</strong>.</p>

<h3>3. PRAZO DE EXECUÇÃO</h3>
<p>A execução dos serviços iniciar-se-á em {{DATA_INICIO}} e possui término previsto para {{DATA_TERMINO}}.</p>

<hr/>
<p><em>Documento gerado automaticamente pelo KeepDocs Workspace em {{DATA_GERACAO}}.</em></p>`,
    fields: [
      { id: "NOME_CONTRATANTE", label: "Nome do Contratante", type: "text", placeholder: "Ex: Acme Corp S.A.", required: true },
      { id: "CPF_CNPJ_CONTRATANTE", label: "CPF/CNPJ do Contratante", type: "text", placeholder: "00.000.000/0001-00", required: true },
      { id: "ENDERECO_CONTRATANTE", label: "Endereço Completo", type: "text", placeholder: "Av. Paulista, 1000 - São Paulo, SP", required: false },
      { id: "NOME_CONTRATADO", label: "Nome do Contratado / Prestador", type: "text", defaultValue: "Tech Solutions Consultoria", required: true },
      { id: "CPF_CNPJ_CONTRATADO", label: "CPF/CNPJ do Contratado", type: "text", defaultValue: "12.345.678/0001-90", required: true },
      { id: "DESCRICAO_SERVICOS", label: "Descrição dos Serviços", type: "text_area", placeholder: "Desenvolvimento de aplicativo web KeepDocs...", required: true },
      { id: "VALOR_TOTAL", label: "Valor Total (R$)", type: "text", placeholder: "R$ 15.000,00", required: true },
      { id: "DATA_VENCIMENTO", label: "Data de Vencimento do Pagamento", type: "date", required: true },
      { id: "DATA_INICIO", label: "Data de Início", type: "date", required: true },
      { id: "DATA_TERMINO", label: "Data de Término", type: "date", required: true },
      { id: "DATA_GERACAO", label: "Data de Assinatura/Geração", type: "date", required: true },
    ],
  },
  {
    id: "anamnese_atendimento",
    title: "Ficha de Anamnese & Atendimento",
    category: "Saúde & Bem-Estar",
    description: "Formulário de avaliação médica, psicológica ou estética com dados clínicos do paciente.",
    templateContent: `<h2>FICHA DE ANAMNESE CLÍNICA</h2>

<p><strong>Paciente:</strong> {{NOME_PACIENTE}} | <strong>Idade:</strong> {{IDADE}} anos | <strong>Data da Consulta:</strong> {{DATA_CONSULTA}}</p>
<p><strong>Profissional Responsável:</strong> {{NOME_PROFISSIONAL}}</p>

<hr/>

<h3>1. Queixa Principal & Histórico</h3>
<p>{{QUEIXA_PRINCIPAL}}</p>

<h3>2. Histórico Médico e Hábitos</h3>
<ul>
  <li><strong>Alergias Conhecidas:</strong> {{ALERGIAS}}</li>
  <li><strong>Uso Continuado de Medicamentos:</strong> {{MEDICAMENTOS}}</li>
  <li><strong>Prática de Atividade Física:</strong> {{ATIVIDADE_FISICA}}</li>
</ul>

<h3>3. Conduta e Recomendações</h3>
<p>{{CONDUTA_RECOMENDADA}}</p>`,
    fields: [
      { id: "NOME_PACIENTE", label: "Nome do Paciente", type: "text", placeholder: "Maria da Silva", required: true },
      { id: "IDADE", label: "Idade", type: "number", placeholder: "34", required: true },
      { id: "DATA_CONSULTA", label: "Data da Consulta", type: "date", required: true },
      { id: "NOME_PROFISSIONAL", label: "Profissional Atendente", type: "text", defaultValue: "Dr. Roberto Mendes", required: true },
      { id: "QUEIXA_PRINCIPAL", label: "Queixa Principal", type: "text_area", placeholder: "Paciente relata dores recorrentes...", required: true },
      { id: "ALERGIAS", label: "Alergias", type: "text", defaultValue: "Nenhuma relatada", required: false },
      { id: "MEDICAMENTOS", label: "Medicamentos em Uso", type: "text", defaultValue: "Nenhum", required: false },
      { id: "ATIVIDADE_FISICA", label: "Atividade Física", type: "select", options: ["Sedentário", "Leve (1-2x/sem)", "Moderado (3-4x/sem)", "Intenso (5x+/sem)"], required: true },
      { id: "CONDUTA_RECOMENDADA", label: "Plano de Tratamento / Recomendações", type: "text_area", placeholder: "Prescrever medicação X e solicitar exames Y...", required: true },
    ],
  },
  {
    id: "relatorio_projeto",
    title: "Relatório de Status de Projeto",
    category: "Gestão & Agilidade",
    description: "Template para envio de atualizações executivas e entregas de sprint.",
    templateContent: `<h2>RELATÓRIO DE STATUS DO PROJETO: {{NOME_PROJETO}}</h2>

<p><strong>Gerente de Projeto:</strong> {{RESPONSAVEL}} | <strong>Status Geral:</strong> <mark>{{STATUS_GERAL}}</mark></p>
<p><strong>Período de Referência:</strong> {{PERIODO_REFERENCIA}}</p>

<h3>🚀 Principais Conquistas Realizadas</h3>
<p>{{CONQUISTAS}}</p>

<h3>⚠️ Riscos e Bloqueios Atuais</h3>
<p>{{BLOQUEIOS}}</p>

<h3>🎯 Próximos Passos (Próxima Sprint)</h3>
<p>{{PROXIMOS_PASSOS}}</p>`,
    fields: [
      { id: "NOME_PROJETO", label: "Nome do Projeto", type: "text", placeholder: "Redesign do Portal Interno", required: true },
      { id: "RESPONSAVEL", label: "Líder do Projeto", type: "text", placeholder: "Ana Beatriz", required: true },
      { id: "STATUS_GERAL", label: "Status Geral", type: "select", options: ["No Prazo (Verde)", "Atenção (Amarelo)", "Crítico (Vermelho)"], required: true },
      { id: "PERIODO_REFERENCIA", label: "Período de Referência", type: "text", placeholder: "Semana 32 - Agosto 2026", required: true },
      { id: "CONQUISTAS", label: "Principais Entregas da Semana", type: "text_area", placeholder: "- Concluído módulo de checkout\n- Testes unitários rodando 100%", required: true },
      { id: "BLOQUEIOS", label: "Impedimentos e Riscos", type: "text_area", defaultValue: "Nenhum impedimento crítico no momento.", required: false },
      { id: "PROXIMOS_PASSOS", label: "Próximas Metas", type: "text_area", placeholder: "- Finalizar integração com gateway de pagamento", required: true },
    ],
  },
];
