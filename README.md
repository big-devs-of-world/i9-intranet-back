# I9+ Intranet API 🚀

Este é o backend da Intranet I9+ Baterias, desenvolvido com **NestJS**. A API fornece funcionalidades essenciais para gestão de usuários, sistema de chat em tempo real (via Firestore) e integração completa com o Google Drive para gerenciamento de arquivos.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [NestJS](https://nestjs.com/)
- **Linguagem:** TypeScript
- **Banco de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticação:** Google OAuth2
- **Documentação:** [Swagger](https://swagger.io/)
- **Gerenciador de Pacotes:** pnpm

---

## 🚀 Como Começar

### Pré-requisitos

- Node.js (v18 ou superior)
- pnpm (`npm install -g pnpm`)
- Uma conta no Google Cloud (para Drive API)
- Um projeto no Firebase (para Firestore)

### Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd i9-intranet-back
   ```

2. Instale as dependências:
   ```bash
   pnpm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto e preencha com as seguintes chaves:

   ```env
   # Servidor
   PORT=3000

   # Firebase Configuration
   FIREBASE_API_KEY=sua_api_key
   FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   FIREBASE_PROJECT_ID=seu_projeto_id
   FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   FIREBASE_APP_ID=seu_app_id

   # Google OAuth2 (Drive API)
   GOOGLE_CLIENT_ID=seu_client_id
   GOOGLE_CLIENT_SECRET=seu_client_secret
   GOOGLE_REDIRECT_URI=seu_redirect_uri
   GOOGLE_REFRESH_TOKEN=seu_refresh_token
   ```

---

## 📖 Guia de Referência da API

Para saber como utilizar cada rota da API, incluindo os parâmetros de URL necessários, formato do corpo da requisição (payload) e os esquemas de resposta, por favor consulte a documentação interativa do Swagger.

Você pode acessá-la com o servidor rodando em:
👉 `http://localhost:3000/docs`

---

## ⚙️ Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `pnpm start:dev` | Inicia o servidor em modo de desenvolvimento com hot-reload. |
| `pnpm build` | Gera o build de produção na pasta `/dist`. |
| `pnpm start:prod` | Executa a versão compilada do projeto. |
| `pnpm lint` | Executa o linter para verificar padrões de código. |
| `pnpm format` | Formata o código utilizando Prettier. |

---

## 📝 Documentação Swagger

A documentação interativa completa está disponível em:
`http://localhost:3000/docs`

---

## 📁 Estrutura do Projeto

```text
src/
├── chat/          # Lógica do sistema de mensagens
├── database/      # Conexão e serviços do Firebase
├── user/          # Gestão de usuários e autenticação
├── utils/         # Enums e auxiliares
├── interfaces/    # DTOs e Tipagens globais
├── app.service.ts # Integração com Google Drive
└── main.ts        # Ponto de entrada da aplicação
```

---

## ⚖️ Licença

Este projeto é de uso interno e está sob licença não autorizada para distribuição externa (**UNLICENSED**).
