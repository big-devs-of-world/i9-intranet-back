import {
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { google, drive_v3, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { File as MulterFile } from 'multer';
import { Readable } from 'stream';

// Interfaces Drive
import { ListFilesQueryDto } from './interfaces/list-files-query.dto'; // GET listar arq
import { ListFilesResponse } from './interfaces/list-files-response.interface'; // GET listar arq
import { SearchFileByNameQueryDto } from './interfaces/search-file-by-name-query.dto'; // GET buscar arq
import { SearchFileByNameResponse } from './interfaces/search-file-by-name-response-interface'; // GET buscar arq
import { UploadFileBodyDto } from './interfaces/upload-file-body.dto'; // POST salvar arq
import { UploadFileResponse } from './interfaces/upload-file-response.interface'; // POST salvar arq

// Interfaces Calendar
import { ListCalendarEventsQueryDto } from './interfaces/list-calendar-events-query.dto';
import { ListCalendarEventsResponse } from './interfaces/list-calendar-events-response.interface';

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// Campos padrão para files.list
const DEFAULT_FIELDS =
  'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, iconLink, owners, parents)';

// Campos padrão para files.create
const DEFAULT_CREATE_FIELDS =
  'id, name, mimeType, size, webViewLink, createdTime';

// Campos padrão para events.list
const DEFAULT_EVENT_FIELDS = 
  'nextPageToken, items(id, summary, description, location, status, htmlLink, created,updated, start, end, organizer, attendees, recurrence, reminders, conferenceData)';

@Injectable()
export class AppService {
  private readonly oauth2Client: OAuth2Client;
  private readonly drive: drive_v3.Drive;
  private readonly calendar: calendar_v3.Calendar; 
  
  constructor() {
    // Lê as credenciais das variáveis de ambiente
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
 
    // Validação da variáveis de ambiente
    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      throw new HttpException(
        {
          message:
            'Credenciais OAuth2 não configuradas. ' +
            'Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ' +
            'GOOGLE_REDIRECT_URI e GOOGLE_REFRESH_TOKEN no arquivo .env.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
 
    // Instancia o cliente OAuth2 com as credenciais do aplicativo
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
 
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
      scope: OAUTH_SCOPES.join(' '),
    });
 
    // Inicializa os clientes das APIs usando o oauth2Client já configurado
    this.drive    = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }
    
  // 📌 loadFileFromDrive → Responsável por listar arquivos do Google Drive
  async loadFileFromDrive(
    query: ListFilesQueryDto,
  ): Promise<ListFilesResponse> {
    try {
      // Chamada Método files.list() da API Google Drive v3
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
      const isExact = String(query.exactMatch).toLowerCase() === 'true';

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
          data?: { error?: { message?: string } };
        };
      };

        throw new HttpException(
          {
            message: 'Erro ao buscar arquivos por nome no Google Drive.',
            detail: 
              err.response?.data?.error?.message ??
              err.message ??
              String(error),
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  // 📌 addFileToDrive → Adiciona arquivos ao Google Drive
  async addFileToDrive(
    file: MulterFile, 
    body: UploadFileBodyDto
  ): Promise<UploadFileResponse>{
    try {
      // Validação de recebimento
      if (!file) {
        throw new HttpException(
          {
            message:
              'Nenhum arquivo enviado. ' +
              'Envie o arquivo no campo "file" via multipart/form-data',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Definição dos metadados do serviço
      const requestBody: drive_v3.Schema$File = {
        name: body.fileName?.trim() || file.originalname,
        ...(body.folderId ? { parents: [body.folderId]} : {})
      };

      // MIME Type
      const mimeType =
        body.mimeType?.trim() ||
        file.mimetype ||
        'application/octet-stream';
      
      // Chama a drive API v3 - files.create()
      const response = await this.drive.files.create({
        requestBody,
        media: {
          mimeType,
          body: Readable.from(file.buffer)
        },
        fields: DEFAULT_CREATE_FIELDS, 
      });

      const created = response.data;

      // Verifica se a API retornou os dados mínimos esperados
      if (!created.id || !created.name){
        throw new HttpException(
          {
            message: 'Arquivo criado, mas resposta da API está incompleta.'
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: `Arquivo "${created.name}" enviado com sucesso para o Google Drive`,
        data: {
          id: created.id,
          name: created.name,
          mimeType: created.mimeType ?? mimeType,
          size: created.size ?? String(file.size),
          webViewLink: created.webViewLink ?? '',
          createdTime: created.createdTime ?? new Date().toISOString(),
        },
      };

    } catch (error) {
      if (error instanceof HttpException) throw error;

      const err = error as {
        message?: string;
        response?: {
          data?: { error?: { message?: string; code?: number }};
        };
      };

      throw new HttpException(
        {
          message: 'Erro ao fazer upload do arquivo para o Google Drive',
          detail:
            err.response?.data?.error?.message ??
            err.message ??
            String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 📌 loadEventsCalendar → Carrega eventos/tarefas do Google Agenda
  async loadEventsCalendar(
    query:ListCalendarEventsQueryDto,
  ): Promise<ListCalendarEventsResponse>{
    try {
      // Define o calendarId a ser consultado
      const calendarId = query.calendarId?.trim() || 'primary';

      // Chama o método events.list da API Google Calendar v3
      const response = await this.calendar.events.list({
        calendarId, // Id do calendário a ser consultado
        maxResults: query.pageSize ? Number(query.pageSize) : 50, // Número máximo de eventos por pag
        pageToken: query.pageToken, // Token para continuar a listagem da pag anterior
        q: query.q, // Busca livre
        timeMin: query.timeMin ?? new Date().toISOString(), // retorna apenas eventos com início >= timeMin
        timeMax: query.timeMax, // Retorna apenas eventos com início <= timeMax
        orderBy: (query.orderBy as 'startTime' | 'updated') ?? 'startTime', // Ordenção
        singleEvents: query.singleEvents ?? true, // Recorrência
        showDeleted: query.showDeleted ?? false, // Eventos deletados
        timeZone: query.timeZone ?? 'America/Sao_Paulo', // Fuso Horário
        fields: DEFAULT_EVENT_FIELDS, // Campos retornados
      });

      // Extrai a lista de eventos da resposta da API
      const events = response.data.items ?? [];

      // Retorno padronizado 
      return {
        statusCode: HttpStatus.OK,

        message: events.length > 0
          ? `${events.length} evento(s) encontrado(s) no calendário "${calendarId}".`
          : `Nenhum evento encontrado no calendário "${calendarId}".`,

        calendarId,
        count: events.length,
        nextPageToken: response.data.nextPageToken ?? null,
        data: events,
      };

    } catch (error) {
      // Repassa HttpExceptions já tratadas sem modificar
      if (error instanceof HttpException) throw error;

      // Tipagem do erro da API Google Calendar
      const err = error as {
        message?: string;
        response?: {
          data?: {
            error?: {
              message?: string;
              code?: number;
            };
          };
        };
      };

      // Código HTTP retornado pela API do Google 
      const googleErrorCode = err.response?.data?.error?.code;

      // Erro 401: token sem escopo de Calendar
      if (googleErrorCode === 401) {
        throw new HttpException(
          {
            message:
              'Acesso negado ao Google Calendar. ' +
              'Regenere o GOOGLE_REFRESH_TOKEN no OAuth Playground ' +
              'selecione o escopo: ' +
              'https://www.googleapis.com/auth/calendar.readonly',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Erro 404: calendário não encontrado
      if (googleErrorCode === 404) {
        throw new HttpException(
          {
            message: 
              `Calendário "${query.calendarId ?? 'primary'}" não encontrado. ` +
              'Use "primary" para o calendário principal ou verifique o ID informado.',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Erro 403: sem permissão de acesso
      if (googleErrorCode === 403){
        throw new HttpException(
          {
            message: 
              'Sem permissão para acessar este calendário. ' +
              'Verifique se o escopo correto foi autorizado no Refresh Token.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // Outro erros
      throw new HttpException(
        {
          message: 'Erro ao listar eventos do Google Calendar.',
          detail:
            err.response?.data?.error?.message ??
            err.message ??
            String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }
  }
}