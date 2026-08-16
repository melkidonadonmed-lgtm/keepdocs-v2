import React, { useState } from "react";
import {
  X,
  LogIn,
  LogOut,
  Cloud,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Database,
  ArrowRight,
  User as UserIcon,
} from "lucide-react";
import { User } from "firebase/auth";
import { signInWithGoogle, signOutFromFirebase } from "../services/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isSyncing: boolean;
  notesCount: number;
  foldersCount: number;
  onManualSync: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSyncing,
  notesCount,
  foldersCount,
  onManualSync,
}) => {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      setSyncStatus("Autenticado com sucesso! Sincronizando com Firestore...");
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Falha ao autenticar com o Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOutFromFirebase();
      setSyncStatus("Desconectado da nuvem Firebase.");
      setTimeout(() => {
        setSyncStatus(null);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao desconectar.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setLoading(true);
      setError(null);
      await onManualSync();
      setSyncStatus("Nuvem sincronizada com sucesso!");
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
    } catch (err: any) {
      setError("Falha na sincronização com o Firestore.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002b36]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-lg overflow-hidden rounded-2xl border border-[rgba(147,161,161,0.18)] border-t-[rgba(238,232,213,0.12)] bg-[#073642] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(147,161,161,0.12)] bg-[#002b36]/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#268bd2]/20 text-[#268bd2] border border-[#268bd2]/30">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#eee8d5] flex items-center gap-2">
                <span>Firebase Cloud & Autenticação</span>
                <span className="text-[10px] font-bold text-[#859900] bg-[#859900]/15 px-2 py-0.5 rounded-full border border-[#859900]/30">
                  Firestore
                </span>
              </h2>
              <p className="text-xs text-[#93a1a1]">
                Sincronize notas, planilhas, pastas e preferências na nuvem em tempo real.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost flex h-8 w-8 items-center justify-center rounded-lg text-[#93a1a1] hover:text-[#eee8d5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-[#dc322f]/15 border border-[#dc322f]/30 p-3 text-xs text-[#dc322f]">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {syncStatus && (
            <div className="flex items-center gap-2 rounded-xl bg-[#859900]/15 border border-[#859900]/30 p-3 text-xs text-[#859900]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 rounded-xl bg-[#002b36]/70 border border-[rgba(147,161,161,0.15)] p-4">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Avatar"}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-full border-2 border-[#2aa198] shadow-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a4553] text-[#2aa198] border border-[#2aa198]/30">
                    <UserIcon className="h-6 w-6" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#eee8d5] truncate">
                      {currentUser.displayName || "Usuário Conectado"}
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] text-[#859900] bg-[#859900]/20 px-2 py-0.5 rounded-full border border-[#859900]/30 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#859900] animate-pulse" />
                      Nuvem Ativa
                    </span>
                  </div>
                  <p className="text-xs text-[#93a1a1] truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Sync Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#002b36]/50 border border-[rgba(147,161,161,0.1)] p-3 text-center">
                  <div className="text-lg font-bold text-[#2aa198] font-mono">{notesCount}</div>
                  <div className="text-[11px] text-[#93a1a1]">Notas no Workspace</div>
                </div>
                <div className="rounded-xl bg-[#002b36]/50 border border-[rgba(147,161,161,0.1)] p-3 text-center">
                  <div className="text-lg font-bold text-[#b58900] font-mono">{foldersCount}</div>
                  <div className="text-[11px] text-[#93a1a1]">Pastas Organizadoras</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleTriggerSync}
                  disabled={loading || isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#2aa198] py-2.5 px-4 text-xs font-semibold text-[#002b36] shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing || loading ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Sincronizando..." : "Sincronizar Agora"}</span>
                </button>

                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="btn-ghost flex items-center justify-center gap-2 rounded-xl border border-[rgba(147,161,161,0.2)] bg-[#002b36] py-2.5 px-4 text-xs font-semibold text-[#dc322f] hover:bg-[#dc322f]/15 transition-all"
                  title="Desconectar do Firebase"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Desconectar</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged out state */
            <div className="space-y-4">
              <div className="rounded-xl bg-[#002b36]/60 border border-[rgba(147,161,161,0.12)] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#eee8d5]">
                  <ShieldCheck className="h-4 w-4 text-[#2aa198]" />
                  <span>Armazenamento Seguro em Nuvem com Firestore</span>
                </div>
                <ul className="space-y-2 text-xs text-[#93a1a1]">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2aa198]" />
                    <span>Acesse suas notas e planilhas em qualquer computador ou dispositivo.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2aa198]" />
                    <span>Sincronização bidirecional em tempo real com regras de segurança ativas.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2aa198]" />
                    <span>Seus dados locais existentes serão enviados automaticamente para sua conta.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#eee8d5] py-3 px-4 text-xs font-bold text-[#002b36] shadow-lg hover:bg-white active:scale-95 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-[#002b36]" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Entrar com o Google (Firebase)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[rgba(147,161,161,0.12)] bg-[#002b36]/90 px-5 py-3 text-xs text-[#586e75]">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#2aa198]" />
            <span>Firestore Enterprise DB</span>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost rounded-lg px-3 py-1 text-xs font-medium text-[#93a1a1] hover:text-[#eee8d5]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
