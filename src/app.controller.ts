import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

// Interfaces
import { ListFilesQueryDto  } from './interfaces/list-files-query.dto';
import { ListFilesResponse } from './interfaces/list-files-response.interface';

@Controller('drive')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 📌 loadFileFromDrive → Listar arquivos do Google Drive
  @Get('files')
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
}