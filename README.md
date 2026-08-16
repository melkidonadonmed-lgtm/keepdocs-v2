<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.
https://ai.studio/apps/9fdbf5a3-cb20-4a63-adc7-7e3f8916b651

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Arquitetura: integração com Google Drive

A integração com o Google Workspace (Drive, Docs, Sheets, Slides e Keep) é feita **100% no cliente**, em `src/services/google*Service.ts`, usando o token OAuth do próprio usuário obtido via Firebase Auth.

O servidor Express (`server.ts`) atua **apenas como proxy das chamadas ao Gemini**, para proteger a `GEMINI_API_KEY`. Não há rotas `/api/drive/*` por decisão de arquitetura: encaminhar tokens OAuth de usuários ao back-end ampliaria a superfície de ataque sem nenhum ganho funcional ou de segurança — diferente do Gemini, no Drive não há segredo do lado do servidor a proteger.
