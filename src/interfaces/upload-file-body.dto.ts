// DTO responsável por definir os campos do body aceitos
// POST /drive/files/upload

export class UploadFileBodyDto {
    // Nome do arquivo salvo
    fileName?: string;

    // ID da pasta de destino
    folderId?: string;

    // MIME type do arquivo 
    mimeType?: string;
}