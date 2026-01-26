// Mailchimp Integration Service
export const mailchimpService = {
  // Lists/Audiences
  getLists: async (): Promise<unknown[]> => [],
  getList: async (_listId: string): Promise<unknown> => null,

  // Members
  addMember: async (_listId: string, _email: string, _data?: Record<string, unknown>): Promise<boolean> => false,
  updateMember: async (_listId: string, _email: string, _data: Record<string, unknown>): Promise<boolean> => false,
  removeMember: async (_listId: string, _email: string): Promise<boolean> => false,
  getMember: async (_listId: string, _email: string): Promise<unknown> => null,

  // Tags
  addTags: async (_listId: string, _email: string, _tags: string[]): Promise<boolean> => false,
  removeTags: async (_listId: string, _email: string, _tags: string[]): Promise<boolean> => false,

  // Campaigns
  getCampaigns: async (): Promise<unknown[]> => [],
  createCampaign: async (_data: Record<string, unknown>): Promise<string | null> => null,
  sendCampaign: async (_campaignId: string): Promise<boolean> => false,
};
