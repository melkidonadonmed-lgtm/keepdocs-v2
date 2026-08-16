import { Note, ChecklistItem } from "../types";

export interface GoogleKeepNoteExport {
  title?: string;
  textContent?: string;
  isArchived?: boolean;
  isPinned?: boolean;
  isTrashed?: boolean;
  color?: string;
  labels?: { name: string }[];
  listContent?: { text: string; isChecked: boolean }[];
  annotations?: { description?: string; url?: string }[];
  userEditedTimestampUsec?: number;
}

/**
 * Parses Google Keep Takeout JSON or JSON note format into KeepDocs Note object
 */
export const parseGoogleKeepJson = (jsonString: string): Partial<Note>[] => {
  try {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    
    return items.map((item: GoogleKeepNoteExport, idx: number) => {
      const isChecklist = item.listContent && item.listContent.length > 0;
      const checklistItems: ChecklistItem[] = isChecklist
        ? item.listContent!.map((li, lIdx) => ({
            id: `keep_chk_${Date.now()}_${idx}_${lIdx}`,
            text: li.text || "",
            completed: !!li.isChecked,
          }))
        : [];

      const tags: string[] = ["GoogleKeep"];
      if (item.labels && Array.isArray(item.labels)) {
        item.labels.forEach((lbl) => {
          if (lbl.name) tags.push(lbl.name);
        });
      }

      let contentHtml = "";
      if (isChecklist) {
        contentHtml = `<p>Lista de verificação importada do Google Keep:</p>`;
      } else if (item.textContent) {
        contentHtml = item.textContent
          .split("\n")
          .map((line) => `<p>${line || "&nbsp;"}</p>`)
          .join("");
      } else {
        contentHtml = "<p></p>";
      }

      return {
        id: `keep_${Date.now()}_${idx}`,
        title: item.title || "Nota Google Keep",
        content: contentHtml,
        plainTextContent: item.textContent || "",
        type: isChecklist ? "checklist" : "standard",
        color: "yellow",
        pinned: !!item.isPinned,
        archived: !!item.isArchived,
        trashed: !!item.isTrashed,
        tags,
        checklist: checklistItems,
        createdAt: item.userEditedTimestampUsec
          ? new Date(Math.floor(item.userEditedTimestampUsec / 1000)).toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    throw new Error("Formato JSON inválido para importação do Google Keep.");
  }
};

/**
 * Converts a KeepDocs note into Google Keep compatible JSON export
 */
export const exportNoteToKeepFormat = (note: Note): GoogleKeepNoteExport => {
  const isChecklist = note.type === "checklist" && note.checklist && note.checklist.length > 0;
  
  return {
    title: note.title,
    textContent: isChecklist ? undefined : note.plainTextContent || note.content.replace(/<[^>]+>/g, "\n"),
    isPinned: note.pinned,
    isArchived: note.archived,
    isTrashed: note.trashed,
    color: "DEFAULT",
    labels: (note.tags || []).map((t) => ({ name: t })),
    listContent: isChecklist
      ? note.checklist!.map((c) => ({
          text: c.text,
          isChecked: c.completed,
        }))
      : undefined,
  };
};
