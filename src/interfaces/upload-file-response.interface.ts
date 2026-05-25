// Contrato de resposta do endpoint POST /drive/files/upload

export interface UploadFileResponse {
  // Código HTTP da resposta
  statusCode: number;

  // Mensagem descritiva
  message: string;

  // Dados do arquivo criado no Google Drive
  data: {
    // ID único do arquivo no Google Drive
    id: string;

    // Nome do arquivo salvo
    name: string;

    // MIME type do arquivo
    mimeType: string;

    // Tamanho do arquivo
    size: string;

    // Link para visualização
    webViewLink: string;

    // Data/Hora de criação (ISO 8601)
    createdTime: string;
  };
}
