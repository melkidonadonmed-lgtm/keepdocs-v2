import { Note, EmbeddedTableData } from "../types";
import { stripHtml, getColumnLetter, evaluateFormula } from "../utils/helpers";

export class NoteExportEngine {
  /**
   * Exporta a nota completa para PDF via janela de impressão estilizada do navegador
   */
  static exportToPDF(note: Note): void {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      alert("Por favor, permita popups para gerar o PDF de impressão.");
      return;
    }

    const title = note.title || "Documento Sem Título";
    const dateFormatted = new Date(note.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let extraContent = "";

    // Checklist
    if (note.type === "checklist" && note.checklist && note.checklist.length > 0) {
      extraContent += `<div style="margin-top: 20px;">
        <h3 style="color: #268bd2; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">Itens da Lista</h3>
        <ul style="list-style: none; padding-left: 0; line-height: 1.8;">
          ${note.checklist
            .map(
              (item) =>
                `<li style="display: flex; align-items: center; margin-bottom: 6px;">
                  <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid ${
                    item.completed ? "#2aa198" : "#888"
                  }; background: ${item.completed ? "#2aa198" : "transparent"}; color: white; border-radius: 3px; margin-right: 10px; text-align: center; font-size: 11px; line-height: 14px;">${
                  item.completed ? "✓" : ""
                }</span>
                  <span style="${item.completed ? "text-decoration: line-through; color: #888;" : ""}">${item.text}</span>
                </li>`
            )
            .join("")}
        </ul>
      </div>`;
    }

    // Embedded Tables
    if (note.tables && note.tables.length > 0) {
      note.tables.forEach((tbl) => {
        extraContent += `<div style="margin-top: 24px;">
          <h3 style="color: #268bd2; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">📊 ${tbl.title}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
              <tr style="background: #f0f4f8;">
                ${tbl.headers
                  .map((h) => `<th style="border: 1px solid #ccc; padding: 8px 12px; text-align: left;">${h}</th>`)
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${tbl.rows
                .map(
                  (r) =>
                    `<tr>
                      ${r
                        .map(
                          (c) =>
                            `<td style="border: 1px solid #ccc; padding: 8px 12px;">${
                              c.computedValue || c.value || ""
                            }</td>`
                        )
                        .join("")}
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
      });
    }

    // Mini Sheet
    if (note.sheetData) {
      const { rows, cols, data } = note.sheetData;
      const headers = Array.from({ length: cols }).map((_, c) => getColumnLetter(c));
      extraContent += `<div style="margin-top: 24px;">
        <h3 style="color: #268bd2; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">📊 Mini-Planilha KeepDocs</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
          <thead>
            <tr style="background: #f0f4f8;">
              <th style="border: 1px solid #ccc; padding: 6px; width: 40px; text-align: center;">#</th>
              ${headers
                .map((h) => `<th style="border: 1px solid #ccc; padding: 6px 12px; text-align: left;">${h}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: rows })
              .map((_, rIdx) => {
                const r = rIdx + 1;
                return `<tr>
                  <td style="border: 1px solid #ccc; padding: 6px; text-align: center; background: #fafafa; font-weight: bold;">${r}</td>
                  ${headers
                    .map((h) => {
                      const key = `${h}${r}`;
                      const cell = data[key];
                      const val = cell?.formula ? evaluateFormula(cell.formula, note.sheetData!) : cell?.value || "";
                      return `<td style="border: 1px solid #ccc; padding: 6px 12px; ${
                        cell?.bold ? "font-weight: bold;" : ""
                      } ${cell?.align === "right" ? "text-align: right;" : ""}">${val}</td>`;
                    })
                    .join("")}
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>`;
    }

    // Canvas Image
    if (note.imageAnnotation?.base64Image) {
      extraContent += `<div style="margin-top: 24px;">
        <h3 style="color: #268bd2; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px;">🎨 Anotação Visual / Canvas</h3>
        <div style="margin-top: 10px; text-align: center;">
          <img src="${note.imageAnnotation.base64Image}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" alt="${title}" />
        </div>
      </div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title} - KeepDocs PDF</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #2e3436;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #073642;
      font-size: 24px;
      margin-bottom: 6px;
      border-bottom: 2px solid #268bd2;
      padding-bottom: 8px;
    }
    .meta {
      font-size: 12px;
      color: #586e75;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .tag {
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 6px;
    }
    .content {
      margin-top: 20px;
      font-size: 14px;
    }
    .content img { max-width: 100%; border-radius: 6px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <span>Data: ${dateFormatted}</span>
    <div>${note.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
  </div>
  <div class="content">
    ${note.content || ""}
  </div>
  ${extraContent}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Exporta a nota completa para formato Markdown (.md)
   */
  static exportToMarkdown(note: Note): void {
    let md = `# ${note.title || "Sem Título"}\n\n`;

    // Data e tags
    md += `*Criado em: ${new Date(note.createdAt).toLocaleDateString("pt-BR")}*\n`;
    if (note.tags && note.tags.length > 0) {
      md += `*Tags: ${note.tags.map((t) => `#${t}`).join(", ")}*\n`;
    }
    md += `\n---\n\n`;

    // Converte HTML do editor para texto Markdown básico
    const plainText = stripHtml(note.content);
    if (plainText) {
      md += plainText + "\n\n";
    }

    // Checklist
    if (note.checklist && note.checklist.length > 0) {
      md += `### Checklist\n\n`;
      note.checklist.forEach((item) => {
        md += `- [${item.completed ? "x" : " "}] ${item.text}\n`;
      });
      md += "\n";
    }

    // Se houver tabelas vinculadas (Embedded Tables)
    if (note.tables && note.tables.length > 0) {
      note.tables.forEach((table) => {
        md += `### 📊 ${table.title}\n\n`;
        md += `| ${table.headers.join(" | ")} |\n`;
        md += `| ${table.headers.map(() => "---").join(" | ")} |\n`;
        table.rows.forEach((row) => {
          md += `| ${row.map((cell) => cell.computedValue || cell.value || "").join(" | ")} |\n`;
        });
        md += "\n";
      });
    }

    // Se for uma Mini-Sheet Planilha
    if (note.sheetData) {
      md += `### 📊 Dados da Planilha Mini-Sheet\n\n`;
      const { rows, cols, data } = note.sheetData;
      const headers = Array.from({ length: cols }).map((_, c) => getColumnLetter(c));
      md += `| # | ${headers.join(" | ")} |\n`;
      md += `| --- | ${headers.map(() => "---").join(" | ")} |\n`;

      for (let r = 1; r <= rows; r++) {
        const rowVals = headers.map((h) => {
          const cell = data[`${h}${r}`];
          return cell?.formula ? evaluateFormula(cell.formula, note.sheetData!) : cell?.value || "";
        });
        md += `| ${r} | ${rowVals.join(" | ")} |\n`;
      }
      md += "\n";
    }

    this.downloadFile(`${this.sanitizeFilename(note.title)}.md`, md, "text/markdown");
  }

  /**
   * Exporta a nota para Texto Puro (.txt)
   */
  static exportToPlainText(note: Note): void {
    let txt = `${(note.title || "Nota Sem Título").toUpperCase()}\n`;
    txt += `Data: ${new Date(note.createdAt).toLocaleString("pt-BR")}\n`;
    if (note.tags && note.tags.length > 0) {
      txt += `Etiquetas: ${note.tags.join(", ")}\n`;
    }
    txt += `--------------------------------------------------------\n\n`;

    const plain = stripHtml(note.content);
    if (plain) {
      txt += `${plain}\n\n`;
    }

    if (note.checklist && note.checklist.length > 0) {
      txt += `CHECKLIST:\n`;
      note.checklist.forEach((item) => {
        txt += ` [${item.completed ? "X" : " "}] ${item.text}\n`;
      });
      txt += `\n`;
    }

    if (note.sheetData) {
      txt += `PLANILHA:\n`;
      const { rows, cols, data } = note.sheetData;
      const headers = Array.from({ length: cols }).map((_, c) => getColumnLetter(c));
      txt += `#\t${headers.join("\t")}\n`;
      for (let r = 1; r <= rows; r++) {
        const rowVals = headers.map((h) => {
          const cell = data[`${h}${r}`];
          return cell?.formula ? evaluateFormula(cell.formula, note.sheetData!) : cell?.value || "";
        });
        txt += `${r}\t${rowVals.join("\t")}\n`;
      }
      txt += `\n`;
    }

    this.downloadFile(`${this.sanitizeFilename(note.title)}.txt`, txt, "text/plain");
  }

  /**
   * Exporta a nota para Documento Word (.doc / .docx compatível)
   */
  static exportToDocx(note: Note): void {
    const title = note.title || "Documento KeepDocs";
    const dateFormatted = new Date(note.createdAt).toLocaleDateString("pt-BR");

    let tablesHtml = "";
    if (note.tables && note.tables.length > 0) {
      note.tables.forEach((tbl) => {
        tablesHtml += `<h3>${tbl.title}</h3>
        <table border="1" style="border-collapse:collapse; width:100%; margin-bottom:16px;">
          <tr style="background-color:#f2f2f2;">
            ${tbl.headers.map((h) => `<th style="padding:6px 10px;">${h}</th>`).join("")}
          </tr>
          ${tbl.rows
            .map(
              (r) =>
                `<tr>${r
                  .map((c) => `<td style="padding:6px 10px;">${c.computedValue || c.value || ""}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </table>`;
      });
    }

    if (note.sheetData) {
      const { rows, cols, data } = note.sheetData;
      const headers = Array.from({ length: cols }).map((_, c) => getColumnLetter(c));
      tablesHtml += `<h3>Planilha Mini-Sheet</h3>
      <table border="1" style="border-collapse:collapse; width:100%; margin-bottom:16px;">
        <tr style="background-color:#f2f2f2;">
          <th style="padding:6px 10px;">#</th>
          ${headers.map((h) => `<th style="padding:6px 10px;">${h}</th>`).join("")}
        </tr>
        ${Array.from({ length: rows })
          .map((_, rIdx) => {
            const r = rIdx + 1;
            return `<tr>
              <td style="padding:6px 10px; font-weight:bold; background:#fafafa;">${r}</td>
              ${headers
                .map((h) => {
                  const cell = data[`${h}${r}`];
                  const val = cell?.formula ? evaluateFormula(cell.formula, note.sheetData!) : cell?.value || "";
                  return `<td style="padding:6px 10px; ${cell?.bold ? "font-weight:bold;" : ""}">${val}</td>`;
                })
                .join("")}
            </tr>`;
          })
          .join("")}
      </table>`;
    }

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333333; margin: 40px; }
          h1 { font-size: 20pt; color: #1a5276; border-bottom: 2px solid #2980b9; padding-bottom: 6px; }
          h2 { font-size: 14pt; color: #2980b9; }
          h3 { font-size: 12pt; color: #2c3e50; }
          .meta { font-size: 9pt; color: #7f8c8d; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th, td { border: 1px solid #bdc3c7; padding: 8px 10px; text-align: left; }
          th { background-color: #ecf0f1; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          <p><strong>Criado em:</strong> ${dateFormatted} | <strong>Tags:</strong> ${note.tags.join(", ") || "Nenhuma"}</p>
        </div>
        <div>
          ${note.content || ""}
        </div>
        ${tablesHtml}
      </body>
      </html>
    `;

    this.downloadFile(`${this.sanitizeFilename(note.title)}.doc`, docContent, "application/msword");
  }

  /**
   * Exporta a planilha ou tabela para formato CSV (.csv)
   */
  static exportToCSV(note: Note): void {
    if (note.sheetData) {
      const { rows, cols, data } = note.sheetData;
      const headers = Array.from({ length: cols }).map((_, c) => getColumnLetter(c));
      let csv = `${headers.map((h) => `"${h}"`).join(",")}\n`;

      for (let r = 1; r <= rows; r++) {
        const rowVals = headers.map((h) => {
          const cell = data[`${h}${r}`];
          const val = cell?.formula ? evaluateFormula(cell.formula, note.sheetData!) : cell?.value || "";
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csv += `${rowVals.join(",")}\n`;
      }

      this.downloadFile(`${this.sanitizeFilename(note.title)}.csv`, csv, "text/csv");
      return;
    }

    if (note.tables && note.tables.length > 0) {
      this.exportTableToCSV(note.tables[0]);
      return;
    }

    // Fallback: convert note text lines to CSV
    const plain = stripHtml(note.content);
    const lines = plain.split("\n").filter((l) => l.trim().length > 0);
    const csv = lines.map((line) => `"${line.replace(/"/g, '""')}"`).join("\n");
    this.downloadFile(`${this.sanitizeFilename(note.title)}.csv`, csv, "text/csv");
  }

  /**
   * Exporta uma tabela interativa específica para formato CSV (.csv)
   */
  static exportTableToCSV(table: EmbeddedTableData): void {
    let csv = `${table.headers.map((h) => `"${h}"`).join(",")}\n`;
    table.rows.forEach((row) => {
      csv += `${row.map((c) => `"${(c.computedValue || c.value || "").replace(/"/g, '""')}"`).join(",")}\n`;
    });

    this.downloadFile(`${this.sanitizeFilename(table.title)}.csv`, csv, "text/csv");
  }

  /**
   * Copia o conteúdo formatado da nota para a área de transferência (Rich HTML + Plain Text)
   */
  static async copyFormattedContent(note: Note): Promise<boolean> {
    const plainText = `${note.title}\n\n${stripHtml(note.content)}`;
    const htmlContent = `<h2>${note.title}</h2><div>${note.content}</div>`;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: "text/plain" });
        const htmlBlob = new Blob([htmlContent], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": textBlob,
            "text/html": htmlBlob,
          }),
        ]);
        return true;
      } else {
        await navigator.clipboard.writeText(plainText);
        return true;
      }
    } catch (err) {
      console.warn("Falha no clipboard rico, tentando fallback:", err);
      try {
        await navigator.clipboard.writeText(plainText);
        return true;
      } catch (fallbackErr) {
        return false;
      }
    }
  }

  /**
   * Exporta imagem PNG (Canvas ou Anexo)
   */
  static exportToPNG(note: Note): void {
    if (note.imageAnnotation?.base64Image) {
      const link = document.createElement("a");
      link.href = note.imageAnnotation.base64Image;
      link.download = `${this.sanitizeFilename(note.title)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (note.attachments && note.attachments.length > 0) {
      const firstImg = note.attachments.find((a) => a.fileType === "image" || a.url.startsWith("data:image"));
      if (firstImg) {
        const link = document.createElement("a");
        link.href = firstImg.url;
        link.download = `${this.sanitizeFilename(note.title)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }
  }

  /**
   * Exporta o estado completo da nota para backup ou reimportação (.json)
   */
  static exportToJSON(note: Note): void {
    const data = JSON.stringify(note, null, 2);
    this.downloadFile(`${this.sanitizeFilename(note.title)}.json`, data, "application/json");
  }

  /**
   * Exporta o backup global de todas as notas do workspace (.json)
   */
  static exportWorkspaceBackup(notes: Note[]): void {
    const data = JSON.stringify({ app: "keepdocs", version: 1, exportedAt: new Date().toISOString(), notes }, null, 2);
    const stamp = new Date().toISOString().slice(0, 10);
    this.downloadFile(`keepdocs_backup_${stamp}.json`, data, "application/json");
  }

  /**
   * Exporta para documento HTML formatado (.html)
   */
  static exportToHTML(note: Note): void {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${note.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #202124; line-height: 1.6; }
    h1 { color: #1a73e8; border-bottom: 2px solid #e8eaed; padding-bottom: 10px; }
    .badge { background: #e8f0fe; color: #1a73e8; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #dadce0; padding: 8px 12px; text-align: left; }
    th { background: #f8f9fa; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <p><strong>Criado:</strong> ${new Date(note.createdAt).toLocaleString("pt-BR")}</p>
  <div>${note.tags.map((t) => `<span class="badge">#${t}</span>`).join("")}</div>
  <hr style="border: none; border-top: 1px solid #dadce0; margin: 20px 0;">
  <div>${note.content}</div>
</body>
</html>`;

    this.downloadFile(`${this.sanitizeFilename(note.title)}.html`, htmlContent, "text/html");
  }

  private static sanitizeFilename(filename: string): string {
    return (filename || "nota")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_");
  }

  private static downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

