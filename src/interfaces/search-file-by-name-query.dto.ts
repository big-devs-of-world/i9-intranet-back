// DTO responsável por definir os parâmetros aceitos
// GET /drive/files/search

export class SearchFileByNameQueryDto {
    // Nome do arquivo 
    name?: string;

    // Define se a busca será exata ou parcial 
    exactMatch?: boolean;

    // Número máximo de arquivos retornados por página
    pageSize?: number;

    // Token da próxima página retornado pela requisição anterior
    pageToken?: string;

    // Campos retornados pela API (files/id, files/name, files/mimeType)
    fields?: string;

    // Critério de ordenação do resultado
    orderBy?: string;
}