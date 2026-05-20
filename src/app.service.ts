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
import { SearchFileByNameQueryDto } from './interfaces/search-file-by-name-query.dto';
import { SearchFileByNameResponse } from './interfaces/search-file-by-name-response-interface';

// Escopos de acesso permitidos para o Google Drive
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
];

const DEFAULT_FIELDS =
  'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink, owners, parents)';

@Injectable()
export class AppService {
  private readonly drive: drive_v3.Drive = (() => {
    // Lê variáveis de ambiente
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const driverKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    // Validação obrigatória das credenciais
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

      // Escopos de acesso ao Drive 
      scopes: DRIVE_SCOPES,
    });

    // Retorna instância autenticadado Google Drive API v3
    return google.drive({
      version: 'v3',
      auth: authClient,
    });

  })();

  
  // 📌 loadFileFromDrive → Responsável por listar arquivos do Google Drive
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
        fields: query.fields ?? DEFAULT_FIELDS,

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

  // 📌 getFileFromDrive → Busca arquivos armazenados no Drive
  async getFileFromDrive( 
    query: SearchFileByNameQueryDto,
  ): Promise<SearchFileByNameResponse> {
    try {
      // Validação dos parâmetros obrigatórios
      if (!query.name || query.name.trim() == ''){
        throw new HttpException(
          {
            message: 'O parâmetro "name" é obrigatório para a busca.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Remove espaços extras e escapa apóstrofos para evitar quebra na Query Language do Drive
      const sanitizedName = query.name.trim().replace(/'/g, "\\'");

      // Conversão segura do flag exactMatch
      const isExact = String(query.exactMatch).toLowerCase() == 'true';

      // Construção da cláusula de busca por nome
      const nameClause = isExact
        ? `name = '${sanitizedName}'`
        : `name contains '${sanitizedName}'`;

      // Montagem da Query completa
      const fullQuery = `trashed = false and ${nameClause}`;

      // Chamada à Google Drive API v3 
      const response = await this.drive.files.list({
        // Filtro: nome + não está na lixeira
        q: fullQuery,

        // Número máximo de resultado por página 
        pageSize: query.pageSize ? Number(query.pageSize) : 20,

        // Token de paginação para navegar entre páginas de resultados
        pageToken: query.pageToken,

        // Campos retornados
        fields: query.fields ?? DEFAULT_FIELDS,

        // Critério de ordenação
        orderBy: query.orderBy ?? 'modifiedTime desc',

        // Habilita busca em Shared Drives além do My Drive
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      // Extração dos arquivos da resposta
      const files = response.data.files ?? [];

      // Retorno padronizado
      return {
        statusCode: HttpStatus.OK, 

        message:
          files.length > 0
            ? `${files.length} arquivo(s) encontrado(s) para "${query.name}".`
            : `Nenhum arquivo encontrado com o nome "${query.name}".`,

        searchTerm: query.name,

        exactMatch: isExact,

        count: files.length,

        nextPageToken: response.data.nextPageToken ?? null,
        
        data: files,
      };
    } catch (error) {
      // Repassa exceções ja tratadas
      if (error instanceof HttpException) {
        throw error;
      }

      // Tratamento de erros da Google Drive API
      const err = error as {
        message?: string;
        response?: {
          data?: { error?: { message?: string, code?: number } };
          status?: number;
        };
      };

      // Extrai mensagem de erro da API do Google 
      const googleErrorMessage =
        err.response?.data?.error?.message;

        throw new HttpException(
          {
            message: 'Erro ao buscar arquivos por nome no Google Drive.',
            detail: googleErrorMessage ?? err.message ?? String(error),
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

}