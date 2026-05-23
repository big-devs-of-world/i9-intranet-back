// Contrato de resposta do endpoint GET /calendar/events

import { calendar_v3 } from "googleapis";

export interface ListCalendarEventsResponse {
    // Código HTTP da resposta
    statusCode: number;

    // Mensagem descritiva sobre o resultado da operação
    message: string;

    // ID do calendário consultado 
    calendarId: string;

    // Quantidade de eventos retornados nesta página
    count: number;

    // Token para buscar a próxima página
    nextPageToken: string | null;

    // Lista de eventos retornados pela API Google Calendar v3
    data:calendar_v3.Schema$Event[];
}