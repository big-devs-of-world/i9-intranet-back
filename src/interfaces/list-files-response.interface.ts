// Contrato de resposta do endpoint GET /drive/files

import { drive_v3 } from "googleapis";

export interface ListFilesResponse {
    // Código HTTP da resposta
    statusCode: number;

    // Mensagem descritiva
    message: string;

    // Quantidade de arquivos retornados
    count: number;

    // Token da próxima página
    nextPageToken: string | null;

    // Lista de arquivos retornados pela Google Drive API
    data: drive_v3.Schema$File[];
}