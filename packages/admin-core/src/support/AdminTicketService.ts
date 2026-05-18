/**
 * Re-exports TicketService and all ticket types from @mpbhealth/advisor-core.
 *
 * This indirection keeps apps/admin-portal from depending on advisor-core
 * directly. Any admin page that needs to work with tickets should import from
 * @mpbhealth/admin-core, not from @mpbhealth/advisor-core.
 */
export {
  TicketService,
  ticketService,
  appendTicketAttachmentsHtml,
  type AdminTicket,
  type AdminTicketDetail,
  type AdminTicketListResult,
  type AdminListTicketsOptions,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
  type TicketComment,
  type TicketContentFormat,
  type TicketRequester,
  type UpdateTicketOptions,
  type CreateTicketOptions,
  type CreateTicketResult,
  type TicketAttachmentUploadResult,
  type TicketFileRow,
} from '@mpbhealth/advisor-core';
