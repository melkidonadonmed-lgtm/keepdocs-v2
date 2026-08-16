import { Note } from "../types";

export const INITIAL_NOTES: Note[] = [
  {
    id: "note_1",
    title: "📋 Contrato Prestação de Serviços - KeepDocs Corp",
    content: `<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS</h1>
<p><strong>CONTRATANTE:</strong> Startup Inovações S.A., inscrito sob CPF/CNPJ 12.345.678/0001-90.</p>
<p><strong>CONTRATADO:</strong> KeepDocs Software LTDA.</p>
<h3>1. DO OBJETO DO CONTRATO</h3>
<p>O presente contrato tem por objeto o desenvolvimento e suporte da plataforma de anotações híbridas com inteligência artificial.</p>
<h3>2. DO VALOR E CONDICIONAMENTO DE PAGAMENTO</h3>
<p>Pela prestação dos serviços acordados, o CONTRATANTE pagará a quantia total de <strong>R$ 28.500,00</strong>.</p>`,
    type: "form",
    color: "blue",
    tags: ["Contrato", "Clientes", "Jurídico"],
    pinned: true,
    archived: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    formTemplateId: "contract_prestacao_servicos",
    formValues: {
      NOME_CONTRATANTE: "Startup Inovações S.A.",
      CPF_CNPJ_CONTRATANTE: "12.345.678/0001-90",
      ENDERECO_CONTRATANTE: "Av. Faria Lima, 2000 - São Paulo, SP",
      NOME_CONTRATADO: "KeepDocs Software LTDA",
      CPF_CNPJ_CONTRATADO: "98.765.432/0001-10",
      DESCRICAO_SERVICOS: "Desenvolvimento do módulo de anotação vetorial e formulários auto-preenchíveis com inteligência artificial.",
      VALOR_TOTAL: "R$ 28.500,00",
      DATA_VENCIMENTO: "2026-08-30",
      DATA_INICIO: "2026-08-01",
      DATA_TERMINO: "2026-11-30",
      DATA_GERACAO: "2026-08-08",
    },
    driveAttachments: [
      {
        id: "drive_att_1",
        name: "Proposta_Comercial_v2.pdf",
        mimeType: "application/pdf",
        size: "2.4 MB",
        driveUrl: "https://drive.google.com/file/d/sample_proposal/view",
        syncedAt: new Date().toISOString(),
        fileType: "pdf",
      },
    ],
    comments: [
      {
        id: "c1",
        author: "Fernanda Costa (Legal)",
        text: "Cláusula de rescisão validada com o setor jurídico.",
        createdAt: "2026-08-08T14:30:00Z",
      },
    ],
  },
  {
    id: "note_2",
    title: "📊 Planejamento Financeiro Q3 - Mini Sheet",
    content: "<p>Planilha de projeção orçamentária para a equipe de produto e engenharia no terceiro trimestre.</p>",
    type: "sheet",
    color: "green",
    tags: ["Financeiro", "Projeções", "Q3"],
    pinned: true,
    archived: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    sheetData: {
      rows: 6,
      cols: 4,
      data: {
        A1: { value: "Item de Custo", bold: true },
        B1: { value: "Orçamento Julho", bold: true, align: "right" },
        C1: { value: "Orçamento Agosto", bold: true, align: "right" },
        D1: { value: "Total Trimestre", bold: true, align: "right" },
        
        A2: { value: "Servidores Cloud Run" },
        B2: { value: "1200", type: "currency" },
        C2: { value: "1450", type: "currency" },
        D2: { value: "=B2+C2", formula: "=B2+C2", bold: true, align: "right" },

        A3: { value: "Licenças API Gemini" },
        B3: { value: "800", type: "currency" },
        C3: { value: "950", type: "currency" },
        D3: { value: "=B3+C3", formula: "=B3+C3", bold: true, align: "right" },

        A4: { value: "Ferramentas de Design & UX" },
        B4: { value: "450", type: "currency" },
        C4: { value: "450", type: "currency" },
        D4: { value: "=B4+C4", formula: "=B4+C4", bold: true, align: "right" },

        A5: { value: "TOTAL GERAL", bold: true },
        B5: { value: "=SUM(B2:B4)", formula: "=SUM(B2:B4)", bold: true, align: "right" },
        C5: { value: "=SUM(C2:C4)", formula: "=SUM(C2:C4)", bold: true, align: "right" },
        D5: { value: "=SUM(D2:D4)", formula: "=SUM(D2:D4)", bold: true, align: "right" },
      },
    },
    driveAttachments: [
      {
        id: "drive_att_2",
        name: "Relatorio_Contabil_Q3.xlsx",
        mimeType: "application/vnd.google-apps.spreadsheet",
        size: "1.1 MB",
        driveUrl: "https://docs.google.com/spreadsheets/d/sample_sheet/edit",
        syncedAt: new Date().toISOString(),
        fileType: "sheet",
      },
    ],
  },
  {
    id: "note_3",
    title: "🖼️ Anotação de Arquitetura UI & Fluxo do Canvas",
    content: "<p>Análise de wireframe do Canvas com anotações visuais, setas de fluxo de usuário e observações de UX.</p>",
    type: "canvas",
    color: "purple",
    tags: ["UI/UX", "Design", "Canvas"],
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    imageAnnotation: {
      base64Image: "",
      width: 600,
      height: 350,
      layers: [
        {
          id: "l1",
          type: "rect",
          x: 40,
          y: 40,
          x2: 560,
          y2: 300,
          color: "#3b82f6",
          width: 3,
        },
        {
          id: "l2",
          type: "text",
          x: 60,
          y: 80,
          text: "Área de Desenho Livre - HTML5 Canvas",
          color: "#1e293b",
          width: 20,
        },
        {
          id: "l3",
          type: "arrow",
          x: 100,
          y: 120,
          x2: 450,
          y2: 220,
          color: "#ef4444",
          width: 4,
        },
        {
          id: "l4",
          type: "text",
          x: 120,
          y: 250,
          text: "🔍 Anotações de revisão com camadas vetoriais reeditáveis",
          color: "#059669",
          width: 16,
        },
      ],
    },
  },
  {
    id: "note_4",
    title: "📝 Reunião de Alinhamento KeepDocs Workspace",
    content: `<h2>Ata da Reunião - Lançamento da Versão v2.0</h2>
<p><strong>Participantes:</strong> Lucas (Engenharia), Camila (Product Owner), Gabriel (UI/UX Design).</p>
<hr/>
<h3>PONTOS DISCUTIDOS:</h3>
<ul>
  <li><strong>Layout Keep em Mosaico:</strong> Implementado suporte a cores pastéis e fixação de cards relevantes no topo.</li>
  <li><strong>Editor Estilo Google Docs:</strong> Expansão fluida para modo tela cheia com barra de ferramentas rica, suporte a Markdown e comandos AI.</li>
  <li><strong>Menu Rápido (Cmd+K):</strong> Navegação e atalhos globais funcionando instantaneamente.</li>
</ul>
<p><blockquote>"Priorizar a experiência responsiva e tempo de resposta ultrarrápido em mobile e desktop."</blockquote></p>`,
    type: "doc",
    color: "amber",
    tags: ["Reunião", "Sprints", "Docs"],
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    comments: [
      {
        id: "c2",
        author: "Camila PO",
        text: "Aprovado para lançamento! Vamos anexar o PDF dos requisitos.",
        createdAt: "2026-08-08T18:10:00Z",
      },
    ],
  },
  {
    id: "note_5",
    title: "✅ Checklist de Entrega da Sprint - Launch Day",
    content: "<p>Lista de tarefas críticas para verificação antes do deploy em produção.</p>",
    type: "checklist",
    color: "teal",
    tags: ["Deploy", "Checklist", "DevOps"],
    pinned: false,
    archived: false,
    trashed: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: [
      { id: "chk_1", text: "Verificar rotas de servidor no Cloud Run (Porta 3000)", completed: true },
      { id: "chk_2", text: "Testar atalho Cmd+K para abertura da Command Palette", completed: true },
      { id: "chk_3", text: "Validar fórmulas SUM e AVERAGE no mini-spreadsheet", completed: true },
      { id: "chk_4", text: "Sincronizar arquivos anexados do Google Drive", completed: true },
      { id: "chk_5", text: "Testar exportação em PDF e formato Markdown no editor Docs", completed: false },
    ],
  },
];
