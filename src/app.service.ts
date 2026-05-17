import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { google, drive_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';

// Interfaces
import { ListFilesQueryDto } from './interfaces/list-files-query.dto';
import { ListFilesResponse } from './interfaces/list-files-response.interface';

// Escopos de acesso permitidos para o Google Drive
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
];

@Injectable()
export class AppService {
  private readonly drive: drive_v3.Drive = (() => {
    // Lê variáveis de ambiente
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const driverKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    // Validação obrigatória
    if (!clientEmail || !driverKey) {
      throw new HttpException(
        {
          message:
            'Credenciais da conta de serviço não configuradas ' +
            '(GOOGLE_CLIENT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY).',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Cria autenticação JWT utilizando Service Account do Google Cloud
    const authClient = new JWT({
      email: clientEmail,

      // Ajusta quebra de linha da chave privada
      key: driverKey.replace(/\\n/g, '\n'),

      // Escopos de acesso
      scopes: DRIVE_SCOPES,
    });

    // Retorna instância autenticadado Google Drive API v3
    return google.drive({
      version: 'v3',
      auth: authClient,
    });

  })();

  
  // 📌 Responsável por listar arquivos do Google Drive
  async loadFileFromDrive(
    query: ListFilesQueryDto,
  ): Promise<ListFilesResponse> {
    try {
      // Chamada da API Google Drive Método files.list()
      const response = await this.drive.files.list({
        // Quantidade máxima de arquivos retornados
        pageSize: query.pageSize ? Number(query.pageSize) : 20,

        // Token de paginação
        pageToken: query.pageToken,

        // Filtro personalizado
        q: query.q
          ? `trashed = false and (${query.q})`
          : 'trashed = false',

        // Campos retornados - Reduz o tamanho do payload e melhora performance
        fields:
          query.fields ??
          [
            'nextPageToken',
            'files/id',
            'files/name',
            'files/mimeType',
            'files/size',
            'files/createdTime',
            'files/modifiedTime',
            'files/webViewLink',
            'files/iconLink',
            'files/owners',
            'files/parents',
          ].join(', '),

        // Ordenação
        orderBy: query.orderBy ?? 'modifiedTime desc',

        // Permite listar arquivos de Shared Drives
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      // Arquivos retornados
      const files = response.data.files ?? [];

      // Retorno padronizado da API
      return {
        statusCode: HttpStatus.OK,

        message:
          files.length > 0
            ? 'Arquivos do Google Drive listados com sucesso.'
            : 'Nenhum arquivo encontrado neste Google Drive.',

        count: files.length,

        nextPageToken:
          response.data.nextPageToken ?? null,

        data: files,
      };
    } catch (error) {
      
      // Repassa exceções já tratadas
      if (error instanceof HttpException) {
        throw error;
      }

      // Estrutura tipada do erro
      const err = error as {
        message?: string;
        response?: {
          data?: unknown;
          status?: number;
        };
      };

      // Exceção genérica
      throw new HttpException(
        {
          message:
            'Erro ao listar arquivos do Google Drive.',

          detail:
            err.message ?? String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}