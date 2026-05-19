import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

// Interfaces
import { ListFilesQueryDto  } from './interfaces/list-files-query.dto';
import { ListFilesResponse } from './interfaces/list-files-response.interface';
import { SearchFileByNameQueryDto } from './interfaces/search-file-by-name-query.dto';
import { SearchFileByNameResponse } from './interfaces/search-file-by-name-response-interface';

@Controller('drive')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 📌 loadFileFromDrive → Listar arquivos do Google Drive
  // GET /drive/files
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

  // 📌 getFileFromDrive → Busca arquivos armazenados no Drive
  // GET /drive/files/search
  @Get('files/search')
  async getFileFromDrive(
    @Query() query: SearchFileByNameQueryDto,
  ): Promise<SearchFileByNameResponse>{
    try {
      // Validação dos parâmetros obrigatórios
      if (!query.name || String(query.name).trim() == '') {
        throw new HttpException (
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
      if (error instanceof HttpException){
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

}