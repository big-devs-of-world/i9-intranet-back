import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { google, drive_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';

// Escopos de acesso
const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

// Define os parâmetros aceitos pelo endpoint GET /drive/files
interface ListFilesQueryDto {
  // Número máximo de arquivos retornados 
  pageSize?: number;

  // Token da página seguinte, retornado pela chamada anterior
  pageToken?: string;

  // Filtro no formato da Drive Search Query Language
  q?: string;
  
  // Define quais campos do objeto File serão retornados
  fields?: string;

  // Critério de ordenação dos resultados
  orderBy?: string;
}

// Contrato tipado do que o endpoint retorna ao usuário
interface ListFilesResponse {
  statusCode: number;
  message: string;
  count: number;
  nextPageToken: string | null;
  data: drive_v3.Schema$File[];
}

@Controller('drive')
export class AppController {
  constructor(private readonly appService: AppService) {}

  private readonly drive: drive_v3.Drive = (() => {
    // Lê credenciais
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const driverKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    // Validação
    if(!clientEmail || !driverKey){
      throw new HttpException(
        {
          message:
            'Credenciais da conta de serviço não configuradas ' + 
            '(GOOGLE_CLIENT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY).',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Instancia o cliente JWT com as credenciais da Service Account
    const authClient = new JWT({
      email: clientEmail,
      key: driverKey.replace(/\\n/g, '\n'),
      scopes: DRIVE_SCOPES,
    });

    // Retorna o cliente Drive v3 autenticado, armazenado na propriedade privada 
    // e reutilizado em todas as requisições ao endpoint
    return google.drive({ version: 'v3', auth: authClient});
  })();

  // 📌 loadFileFromDrive → Carrega arquivos do Google Drive
  @Get('files')
  async loadFileFromDrive(@Query() query: ListFilesQueryDto,
  ): Promise<ListFilesResponse>{
    try {
      // Chama o método files.list da Google Drive API v3
      const response = await this.drive.files.list({
        // Máximo de itens retornados 
        pageSize: query.pageSize ? Number(query.pageSize) : 20,

        // Token para continuar a listagem da página anterior
        pageToken: query.pageToken,

        // Filtro
        q: query.q
          ? `trashed = false and (${query.q})`
          : 'trashed = false',

        // Campos retornados. Para reduzir o tamanho do payload e melhorar a performace 
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

        // Shared Drives para incluir arquivos de Drives compartilhados
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      const files = response.data.files ?? [];

      return {
        statusCode: HttpStatus.OK,
        message:
          files.length > 0
            ? 'Arquivos do Google Drive listados com sucesso.'
            : 'Nenhum arquivo encontrado neste Google Drive.',
        count: files.length,
        nextPageToken: response.data.nextPageToken ?? null,
        data: files,
      };

    } catch (error) {
      if (error instanceof HttpException) throw error;

      const err = error as {
        message?: string;
        response?: { data?: unknown; status?: number };
      };

      throw new HttpException(
        {
          message: 'Erro ao listar arquivos do Google Drive.',
          detail: err.message ?? String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}