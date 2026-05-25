// Contrato de resposta do endpoint GET /drive/files/search

import { drive_v3 } from 'googleapis';

export interface SearchFileByNameResponse {
  // Código HTTP da resposta
  statusCode: number;

  // Mensagem descritiva sobre o resultado da operação
  message: string;

  // Termo utilizado na busca (Debug)
  searchTerm: string;

  // Indica se a busca foi exata (true) ou parcial (false)
  exactMatch: boolean;

  // Quantidade de arquivos retornados na página atual
  count: number;

  // Token da próxima página
  nextPageToken: string | null;

  // Lista de arquivos retornados pela Google Drive API v3
  data: drive_v3.Schema$File[];
}
