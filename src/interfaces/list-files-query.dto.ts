// DTO responsável por definir os parâmetros aceitos
// pelo endpoint GET /drive/files

export class ListFilesQueryDto {
    // Número máximo de arquivos retornados
    pageSize?: number;

    // Token da próxima página retornado pela requisição anterior
    pageToken?: string;

    // Filtro utilizando a Drive Search Query Language
    q?: string;

    // Campos retornados pela API
    fields?: string;

    // Critério de ordenação dos resultados
    orderBy?: string;
}