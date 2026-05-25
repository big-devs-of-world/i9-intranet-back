// DTO responsável por definir os parâmetros aceitos
// GET /calendar/events

export class ListCalendarEventsQueryDto {
  // Id do calendário a ser consultado
  calendarId?: string;

  // Número máximo de eventos retornados por página
  pageSize?: number;

  // Token da próxima página retornado pela requisição anterior
  pageToken?: string;

  // Filtro livre (título, descrição e localização do evento)
  q?: string;

  // Data/Hora de início mínima para filtrar eventos (ISO 8601)
  timeMin?: string;

  // Data/Hora de início máxima para filtrar eventos (ISO 8601)
  timeMax?: string;

  // Critério de ordenação dos resultados
  orderBy?: string;

  // Se true, expande eventos recorrentes em instâncias individuais
  singleEvents?: boolean;

  // Se true, inclui eventos cancelados/deletados na resposta
  showDeleted?: boolean;

  // Fuso horário IANA para exibição das data/horas na resposta
  timeZone?: string;
}
