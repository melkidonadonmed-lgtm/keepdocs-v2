import { useCallback, type Dispatch, type SetStateAction } from "react";
import { Note } from "../types";
import { NoteExportEngine } from "../services/NoteExportEngine";

/**
 * Backup global do workspace: exporta todas as notas como um único
 * arquivo `.json` e restaura um backup previamente exportado
 * (substituindo as notas atuais, mediante confirmação).
 */
export function useWorkspaceBackup(
  notes: Note[],
  setNotes: Dispatch<SetStateAction<Note[]>>,
  setStorageError: Dispatch<SetStateAction<string | null>>
) {
  const exportBackup = useCallback(() => {
    NoteExportEngine.exportWorkspaceBackup(notes);
  }, [notes]);

  const importBackup = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          const imported: Note[] = Array.isArray(parsed) ? parsed : parsed.notes;
          if (!Array.isArray(imported) || imported.length === 0) {
            throw new Error("Arquivo de backup inválido ou vazio.");
          }
          if (window.confirm(`Importar backup com ${imported.length} nota(s)? Isso substituirá as notas atuais.`)) {
            setNotes(imported);
          }
        } catch (err) {
          console.error("Erro ao importar backup:", err);
          setStorageError("Falha ao importar o backup: arquivo JSON inválido.");
        }
      };
      reader.readAsText(file);
    },
    [setNotes, setStorageError]
  );

  return { exportBackup, importBackup };
}
