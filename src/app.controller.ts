import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import multer from 'multer';
import { File as MulterFile } from 'multer';

import { AppService } from './app.service';

// Interfaces Driver
import { ListFilesQueryDto  } from './interfaces/list-files-query.dto';
import { ListFilesResponse } from './interfaces/list-files-response.interface';
import { SearchFileByNameQueryDto } from './interfaces/search-file-by-name-query.dto';
import { SearchFileByNameResponse } from './interfaces/search-file-by-name-response-interface';
import { UploadFileBodyDto } from './interfaces/upload-file-body.dto';
import { UploadFileResponse } from './interfaces/upload-file-response.interface';

// Interfaces Calendar
import { ListCalendarEventsQueryDto } from './interfaces/list-calendar-events-query.dto';
import { ListCalendarEventsResponse } from './interfaces/list-calendar-events-response.interface';

@ApiTags('Drive')
@Controller('drive')
export class DriveController {
  constructor(private readonly appService: AppService) {}

  // 📌 loadFileFromDrive → Listar arquivos do Google Drive
  // GET /drive/files
  @Get('files')
  @ApiOperation({ summary: 'Listar arquivos do Google Drive' })
  async loadFileFromDrive(
    @Query() query: ListFilesQueryDto,
  ): Promise<ListFilesResponse> {
    try {
      // Chama a regra de negócio no service
      return await this.appService.loadFileFromDrive(query);
    } catch (error) {
      // Repassa HttpException já tratadas
      if (error instanceof HttpException) {
        throw error;
      }

      // Tratamento genérico
      throw new HttpException(
        {
          message: 'Erro interno ao processar a requisição.',
          detail: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 📌 getFileFromDrive → Busca arquivos armazenados no Drive
  // GET /drive/files/search
  @Get('files/search')
  @ApiOperation({ summary: 'Buscar arquivos por nome no Google Drive' })
  async getFileFromDrive(
    @Query() query: SearchFileByNameQueryDto,
  ): Promise<SearchFileByNameResponse> {
    try {
      // Validação dos parâmetros obrigatórios
      if (!query.name || String(query.name).trim() == '') {
        throw new HttpException(
          {
            message:
              'O parâmetro "name" é obrigatório. ' +
              'Ex: GET /drive/files/search?name=nome-arquivo',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Delega lógica de negócio ao AppService
      return await this.appService.getFileFromDrive(query);
    } catch (error) {
      // Repassa HttpExceptions já tratadas
      if (error instanceof HttpException) {
        throw error;
      }

      // Tratamento genérico 
      throw new HttpException(
        {
          message: 'Erro interno ao buscar arquivos por nome.',
          detail: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 📌 addFileToDrive → Adiciona arquivos ao Google Drive
  // POST /drive/files/upload
  @Post('files/upload')
  @ApiOperation({ summary: 'Fazer upload de arquivo para o Google Drive' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dados do arquivo a ser enviado',
    type: UploadFileBodyDto,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileName: { type: 'string' },
        folderId: { type: 'string' },
        mimeType: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // Mantém o arquivo em Buffer de memória
      storage: multer.memoryStorage(),

      // Limite de 50MB por arquivo
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async addFileToDrive(
    @UploadedFile() file: MulterFile,
    @Body() body: UploadFileBodyDto,
  ): Promise<UploadFileResponse> {
    try {
      if (!file) {
        throw new HttpException(
          {
            message:
              'Nenhum arquivo recebido.' +
              'Envie o arquivo no campo "file" via multipart/form-data.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.appService.addFileToDrive(file, body);

    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        {
          message: 'Erro interno ao fazer upload do arquivo.',
          detail: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

@Controller('calendar')
export class CalendarController {
  constructor(private readonly appService: AppService) {}

    // 📌 uploadEventsCalendar → Carrega eventos/tarefas do Google Agenda
    @Get('events')
    async uploadEventsCalendar(
      @Query() query: ListCalendarEventsQueryDto,
    ): Promise<ListCalendarEventsResponse> {
      try {
        // Delega toda a lógica de negócio ao AppService
        return await this.appService.loadEventsCalendar(query);

      } catch (error) {
        // Repassa HttpExceptions já tratadas no service sem modificar
        if (error instanceof HttpException) throw error;

        // Tratamento genérico 
        throw new HttpException(
          {
            message: 'Erro interno ao processar a requisição de eventos.',
            detail: error instanceof Error ? error.message : String(error),
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
}