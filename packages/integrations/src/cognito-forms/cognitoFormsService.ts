// Cognito Forms Integration Service
export const cognitoFormsService = {
  // Forms
  getForms: async (): Promise<unknown[]> => [],
  getForm: async (_formId: string): Promise<unknown> => null,

  // Entries
  getEntries: async (_formId: string, _params?: Record<string, unknown>): Promise<unknown[]> => [],
  getEntry: async (_formId: string, _entryId: string): Promise<unknown> => null,
  createEntry: async (_formId: string, _data: Record<string, unknown>): Promise<string | null> => null,
  updateEntry: async (_formId: string, _entryId: string, _data: Record<string, unknown>): Promise<boolean> => false,
  deleteEntry: async (_formId: string, _entryId: string): Promise<boolean> => false,

  // Webhooks
  verifyWebhook: (_signature: string, _payload: string): boolean => false,
  parseWebhookPayload: (_payload: string): Record<string, unknown> => ({}),
};
