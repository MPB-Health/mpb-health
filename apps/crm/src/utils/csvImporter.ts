import type { LeadCreateInput, LeadPriority } from '@mpbhealth/crm-core';

/**
 * Complete Zoho CRM Contact interface - ALL 157 fields from export
 */
export interface ZohoContact {
  // Core identification
  recordId?: string;
  contactOwnerId?: string;
  contactOwner?: string;
  leadSource?: string;
  firstName?: string;
  lastName?: string;
  producerNameId?: string;
  producerName?: string;
  email?: string;
  title?: string;
  phone?: string;
  fax?: string;
  mobile?: string;
  dateOfBirth?: string;
  
  // Audit fields
  createdById?: string;
  createdBy?: string;
  modifiedById?: string;
  modifiedBy?: string;
  createdTime?: string;
  modifiedTime?: string;
  
  // Contact info
  contactName?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
  emailOptOut?: string;
  salutation?: string;
  secondaryEmail?: string;
  currency?: string;
  exchangeRate?: string;
  lastActivityTime?: string;
  territories?: string;
  
  // Family members
  spouse?: string;
  spouseDob?: string;
  child1?: string;
  child1Dob?: string;
  child2?: string;
  child2Dob?: string;
  child3?: string;
  child3Dob?: string;
  child4?: string;
  child4Dob?: string;
  child5?: string;
  child5Dob?: string;
  
  // SSN fields
  primarySSNumber?: string;
  spouseSSNumber?: string;
  child1SSNumber?: string;
  child2SSNumber?: string;
  child3SSNumber?: string;
  child4SSNumber?: string;
  child5SSNumber?: string;
  
  // Family contact info
  spouseAddress?: string;
  spousePhone?: string;
  spouseEmail?: string;
  child1Address?: string;
  child1Phone?: string;
  child1Email?: string;
  child2Address?: string;
  child2Phone?: string;
  child2Email?: string;
  child3Address?: string;
  child3Phone?: string;
  child3Email?: string;
  child4Address?: string;
  child4Phone?: string;
  child4Email?: string;
  child5Address?: string;
  child5Phone?: string;
  child5Email?: string;
  
  // Notes and history
  notesHistory?: string;
  
  // Sales/Agent info
  affiliate?: string;
  affiliateReferral?: string;
  affiliateRepMonthly?: string;
  teamLeader?: string;
  teamLeaderMonthly?: string;
  teamLeaderReferral?: string;
  director?: string;
  directorReferral?: string;
  directorMonthly?: string;
  producerCommission?: string;
  commissionPercentage?: string;
  
  // Insurance/Product info
  carrier?: string;
  previousProduct?: string;
  monthlyPremium?: string;
  contactStatus?: string;
  product?: string;
  coverageOption?: string;
  startDate?: string;
  cancellationDate?: string;
  
  // Referral info
  referralSource?: string;
  referringMember?: string;
  mpbReferralFee?: string;
  referralRequirementSatisfied?: string;
  dateReferralPaid?: string;
  
  // Add-ons and benefits
  addOnProduct?: string;
  declined?: string;
  chargeWaived?: string;
  vision?: string;
  dental?: string;
  iuaAmount?: string;
  
  // Financial
  amountReceived?: string;
  householdAnnualAdjGross?: string;
  
  // Member info
  primaryMemberGender?: string;
  maritalStatus?: string;
  middleInitial?: string;
  birthMonth?: string;
  taxId?: string;
  
  // Life codes
  mpowerLifeCode?: string;
  lifeCode2nd?: string;
  lifeCode3rd?: string;
  lifeCode4th?: string;
  lifeCode5th?: string;
  
  // Fulfillment/Onboarding
  welcomeCallPerformedBy?: string;
  welcomeCallStatus?: string;
  fulfillmentLetterMailed?: string;
  fulfillmentEmailSent?: string;
  completeDate?: string;
  mecSubmitted?: string;
  mecDecisionConfirmed?: string;
  selectConversionCompleted?: string;
  
  // Work info
  workPhone?: string;
  companyAssociation?: string;
  businessOrPracticeName?: string;
  
  // Analytics/Tracking
  tag?: string;
  daysVisited?: string;
  averageTimeSpent?: string;
  numberOfChats?: string;
  mostRecentVisit?: string;
  firstVisit?: string;
  firstPageVisited?: string;
  referrer?: string;
  visitorScore?: string;
  
  // Risk and payments
  riskAssessmentPaid?: string;
  
  // Data processing
  dataProcessingBasisDetailsId?: string;
  dataProcessingBasis?: string;
  dataSource?: string;
  preferredMethodOfCommunication?: string;
  
  // DPC/Portal
  dpcName?: string;
  cirrusRegistrationDate?: string;
  mpbPortalUsername?: string;
  mpbPortalPassword?: string;
  
  // Subscription
  unsubscribedMode?: string;
  unsubscribedTime?: string;
  
  // Admin/System
  admin123?: string;
  changeLogTime?: string;
  locked?: string;
  lastEnrichedTime?: string;
  enrichStatus?: string;
  
  // App and permissions
  mpbAppDownloaded?: string;
  thirdPartyPayor?: string;
  atap?: string;
  permissionToDiscussPlan?: string;
  medicalReleaseFormOnFile?: string;
  
  // Outreach
  wcOutreachDate?: string;
  e123MemberId?: string;
  
  // Connected records
  connectedToModule?: string;
  connectedToId?: string;
}

/**
 * Complete CSV column mapping - ALL 157 columns from Zoho export
 */
const COLUMN_MAPPING: Record<string, keyof ZohoContact> = {
  // Core identification
  'Record Id': 'recordId',
  'Contact Owner.id': 'contactOwnerId',
  'Contact Owner': 'contactOwner',
  'Lead Source': 'leadSource',
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Producer Name.id': 'producerNameId',
  'Producer Name': 'producerName',
  'Email': 'email',
  'Title': 'title',
  'Phone': 'phone',
  'Fax': 'fax',
  'Mobile': 'mobile',
  'Date of Birth': 'dateOfBirth',
  
  // Audit fields
  'Created By.id': 'createdById',
  'Created By': 'createdBy',
  'Modified By.id': 'modifiedById',
  'Modified By': 'modifiedBy',
  'Created Time': 'createdTime',
  'Modified Time': 'modifiedTime',
  
  // Contact info
  'Contact Name': 'contactName',
  'Mailing Street': 'mailingStreet',
  'Mailing City': 'mailingCity',
  'Mailing State': 'mailingState',
  'Mailing Zip': 'mailingZip',
  'Email Opt Out': 'emailOptOut',
  'Salutation': 'salutation',
  'Secondary Email': 'secondaryEmail',
  'Currency': 'currency',
  'Exchange Rate': 'exchangeRate',
  'Last Activity Time': 'lastActivityTime',
  'Territories': 'territories',
  
  // Family members
  'Spouse': 'spouse',
  'Spouse - DOB': 'spouseDob',
  'Child 1': 'child1',
  'Child 1-DOB': 'child1Dob',
  'Child 2': 'child2',
  'Child 2-DOB': 'child2Dob',
  'Child 3': 'child3',
  'Child 3 -DOB': 'child3Dob',
  'Child 4': 'child4',
  'Child 4 -DOB': 'child4Dob',
  'Child 5': 'child5',
  'Child 5 -DOB': 'child5Dob',
  
  // SSN fields
  'Primary S.S Number': 'primarySSNumber',
  'Spouse S.S. Number': 'spouseSSNumber',
  'Child 1 S.S. Number': 'child1SSNumber',
  'Child 2 S.S. Number': 'child2SSNumber',
  'Child 3 S.S. Number': 'child3SSNumber',
  'Child 4 S.S. Number': 'child4SSNumber',
  'Child 5 S.S. Number': 'child5SSNumber',
  
  // Family contact info
  'Spouse Address': 'spouseAddress',
  'Spouse Phone Number': 'spousePhone',
  'Spouse Email': 'spouseEmail',
  'Child 1 Address': 'child1Address',
  'Child 1 Phone Number': 'child1Phone',
  'Child 1 Email': 'child1Email',
  'Child 2 Address': 'child2Address',
  'Child 2 Phone Number': 'child2Phone',
  'Child 2 Email': 'child2Email',
  'Child 3 Address': 'child3Address',
  'Child 3 Phone Number': 'child3Phone',
  'Child 3 Email': 'child3Email',
  'Child 4 Address': 'child4Address',
  'Child 4 Phone Number': 'child4Phone',
  'Child 4 Email': 'child4Email',
  'Child 5 Address': 'child5Address',
  'Child 5 Phone Number': 'child5Phone',
  'Child 5 Email': 'child5Email',
  
  // Notes and history
  'Notes History': 'notesHistory',
  
  // Sales/Agent info
  'Affiliate': 'affiliate',
  'Affiliate Referral': 'affiliateReferral',
  'Affiliate Rep  Monthly': 'affiliateRepMonthly',
  'Team Leader': 'teamLeader',
  'Team Leader Monthly': 'teamLeaderMonthly',
  'Team Leader Referral': 'teamLeaderReferral',
  'Director': 'director',
  'Director Referral': 'directorReferral',
  'Director Monthly': 'directorMonthly',
  'Producer Commission': 'producerCommission',
  'Commission Percentage': 'commissionPercentage',
  
  // Insurance/Product info
  'Carrier': 'carrier',
  'Previous Product': 'previousProduct',
  'Monthly Premium': 'monthlyPremium',
  'Contact Status': 'contactStatus',
  'Product': 'product',
  'Coverage Option': 'coverageOption',
  'Start Date': 'startDate',
  'Cancellation Date': 'cancellationDate',
  
  // Referral info
  'Referral Source': 'referralSource',
  'Referring Member': 'referringMember',
  'MPB Referral Fee': 'mpbReferralFee',
  'Referral requirement satisfied': 'referralRequirementSatisfied',
  'Date Referral Paid': 'dateReferralPaid',
  
  // Add-ons and benefits
  'Add on Product': 'addOnProduct',
  'Declined': 'declined',
  'Charge Waived': 'chargeWaived',
  'Vision': 'vision',
  'Dental': 'dental',
  'IUA Amount': 'iuaAmount',
  
  // Financial
  'Amount Received': 'amountReceived',
  'Household Annual Adj Gross': 'householdAnnualAdjGross',
  
  // Member info
  'Primary Member Gender': 'primaryMemberGender',
  'Marital Status': 'maritalStatus',
  'Middle Initial': 'middleInitial',
  'Birth Month': 'birthMonth',
  'Tax-ID': 'taxId',
  
  // Life codes
  'MPower Life Code': 'mpowerLifeCode',
  '2nd Life Code': 'lifeCode2nd',
  '3rd Life Code': 'lifeCode3rd',
  '4th Life Code': 'lifeCode4th',
  '5th Life Code': 'lifeCode5th',
  
  // Fulfillment/Onboarding
  'Welcome call performed by': 'welcomeCallPerformedBy',
  'Welcome Call Status': 'welcomeCallStatus',
  'Fulfillment Letter mailed': 'fulfillmentLetterMailed',
  'Fulfillment Email Sent': 'fulfillmentEmailSent',
  'Complete Date': 'completeDate',
  'MEC Submitted': 'mecSubmitted',
  'MEC Decision Confirmed': 'mecDecisionConfirmed',
  'Select Conversion Completed': 'selectConversionCompleted',
  
  // Work info
  'Work Phone': 'workPhone',
  'Company/Association': 'companyAssociation',
  'Business or Practice Name': 'businessOrPracticeName',
  
  // Analytics/Tracking
  'Tag': 'tag',
  'Days Visited': 'daysVisited',
  'Average Time Spent (Minutes)': 'averageTimeSpent',
  'Number Of Chats': 'numberOfChats',
  'Most Recent Visit': 'mostRecentVisit',
  'First Visit': 'firstVisit',
  'First Page Visited': 'firstPageVisited',
  'Referrer': 'referrer',
  'Visitor Score': 'visitorScore',
  
  // Risk and payments
  'Risk assessment paid': 'riskAssessmentPaid',
  
  // Data processing
  'Data Processing Basis Details.id': 'dataProcessingBasisDetailsId',
  'Data Processing Basis': 'dataProcessingBasis',
  'Data Source': 'dataSource',
  'Preferred Method of Communication': 'preferredMethodOfCommunication',
  
  // DPC/Portal
  'DPC Name': 'dpcName',
  'Cirrus registration Date': 'cirrusRegistrationDate',
  'MPB Portal Username': 'mpbPortalUsername',
  'MPB Portal Password': 'mpbPortalPassword',
  
  // Subscription
  'Unsubscribed Mode': 'unsubscribedMode',
  'Unsubscribed Time': 'unsubscribedTime',
  
  // Admin/System
  'Admin123': 'admin123',
  'Change Log Time': 'changeLogTime',
  'Locked': 'locked',
  'Last Enriched Time': 'lastEnrichedTime',
  'Enrich Status': 'enrichStatus',
  
  // App and permissions
  'MPB APP Downloaded': 'mpbAppDownloaded',
  'Third Party Payor': 'thirdPartyPayor',
  'ATAP': 'atap',
  'Permission to Discuss Plan': 'permissionToDiscussPlan',
  'Medical Release Form on File': 'medicalReleaseFormOnFile',
  
  // Outreach
  'WC Outreach Date': 'wcOutreachDate',
  'E123 Member ID': 'e123MemberId',
  
  // Connected records
  'Connected To.module': 'connectedToModule',
  'Connected To.id': 'connectedToId',
};

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: ZohoContact }>;
  leads: LeadCreateInput[];
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  defaultStage?: string;
  defaultPriority?: LeadPriority;
  batchSize?: number;
}

/**
 * Parse CSV content into an array of records
 */
export function parseCSV(csvContent: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Handle last field/line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(f => f)) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Map CSV headers to internal field names
 * Also captures any unmapped columns for storage
 */
function mapHeaders(headers: string[]): { 
  mapping: Map<number, keyof ZohoContact>;
  unmappedHeaders: Map<number, string>;
} {
  const mapping = new Map<number, keyof ZohoContact>();
  const unmappedHeaders = new Map<number, string>();
  
  headers.forEach((header, index) => {
    const cleanHeader = header.trim();
    const mappedField = COLUMN_MAPPING[cleanHeader];
    if (mappedField) {
      mapping.set(index, mappedField);
    } else if (cleanHeader) {
      // Store unmapped headers so we don't lose any data
      unmappedHeaders.set(index, cleanHeader);
    }
  });

  return { mapping, unmappedHeaders };
}

/**
 * Parse a single row into a ZohoContact object
 */
function parseRow(
  row: string[], 
  headerMapping: Map<number, keyof ZohoContact>,
  unmappedHeaders: Map<number, string>
): { contact: ZohoContact; extraFields: Record<string, string> } {
  const contact: ZohoContact = {};
  const extraFields: Record<string, string> = {};

  // Map known fields
  headerMapping.forEach((field, index) => {
    if (row[index] !== undefined && row[index] !== '') {
      (contact as Record<string, string>)[field] = row[index];
    }
  });

  // Capture unmapped fields
  unmappedHeaders.forEach((header, index) => {
    if (row[index] !== undefined && row[index] !== '') {
      extraFields[header] = row[index];
    }
  });

  return { contact, extraFields };
}

/**
 * Map Zoho contact status to pipeline stage
 */
function mapStatusToStage(status?: string): string {
  if (!status) return 'new';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('enrolled') || statusLower.includes('active')) {
    return 'won';
  }
  if (statusLower.includes('cancelled') || statusLower.includes('lost') || statusLower.includes('in-active') || statusLower.includes('inactive')) {
    return 'lost';
  }
  if (statusLower.includes('qualified')) {
    return 'qualified';
  }
  if (statusLower.includes('proposal')) {
    return 'proposal';
  }
  if (statusLower.includes('contacted')) {
    return 'contacted';
  }
  if (statusLower.includes('opportunity')) {
    return 'negotiation';
  }
  
  return 'new';
}

/**
 * Determine priority based on contact data
 */
function determinePriority(contact: ZohoContact): LeadPriority {
  // High priority for recent activity
  if (contact.lastActivityTime) {
    const lastActivity = new Date(contact.lastActivityTime);
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 7) return 'high';
    if (daysSinceActivity < 30) return 'medium';
  }
  
  // Medium priority for contacts with premium info
  if (contact.monthlyPremium && parseFloat(contact.monthlyPremium) > 0) {
    return 'medium';
  }
  
  // Check visitor score
  if (contact.visitorScore) {
    const score = parseInt(contact.visitorScore, 10);
    if (score > 70) return 'high';
    if (score > 40) return 'medium';
  }
  
  return 'low';
}

/**
 * Validate and clean email
 */
function cleanEmail(email?: string): string | undefined {
  if (!email) return undefined;
  
  // Skip placeholder emails
  if (email.includes('@noemail.com') || email.includes('@dispostable.com') || email.includes('@placeholder')) {
    return undefined;
  }
  
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(cleaned) ? cleaned : undefined;
}

/**
 * Clean and format phone number
 */
function cleanPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check for valid US phone (10 or 11 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone; // Return original if can't parse
}

/**
 * Build family members array from contact data
 */
function buildFamilyMembers(contact: ZohoContact): Record<string, unknown>[] {
  const members: Record<string, unknown>[] = [];
  
  // Spouse
  if (contact.spouse) {
    members.push({
      relationship: 'spouse',
      name: contact.spouse,
      dob: contact.spouseDob,
      ssn: contact.spouseSSNumber,
      address: contact.spouseAddress,
      phone: contact.spousePhone,
      email: contact.spouseEmail,
    });
  }
  
  // Children
  const childData = [
    { name: contact.child1, dob: contact.child1Dob, ssn: contact.child1SSNumber, address: contact.child1Address, phone: contact.child1Phone, email: contact.child1Email },
    { name: contact.child2, dob: contact.child2Dob, ssn: contact.child2SSNumber, address: contact.child2Address, phone: contact.child2Phone, email: contact.child2Email },
    { name: contact.child3, dob: contact.child3Dob, ssn: contact.child3SSNumber, address: contact.child3Address, phone: contact.child3Phone, email: contact.child3Email },
    { name: contact.child4, dob: contact.child4Dob, ssn: contact.child4SSNumber, address: contact.child4Address, phone: contact.child4Phone, email: contact.child4Email },
    { name: contact.child5, dob: contact.child5Dob, ssn: contact.child5SSNumber, address: contact.child5Address, phone: contact.child5Phone, email: contact.child5Email },
  ];
  
  childData.forEach((child, index) => {
    if (child.name) {
      members.push({
        relationship: 'child',
        childNumber: index + 1,
        name: child.name,
        dob: child.dob,
        ssn: child.ssn,
        address: child.address,
        phone: child.phone,
        email: child.email,
      });
    }
  });
  
  return members;
}

/**
 * Convert ZohoContact to LeadCreateInput with ALL data preserved
 */
function convertToLead(
  contact: ZohoContact, 
  extraFields: Record<string, string>,
  options: ImportOptions = {}
): LeadCreateInput | null {
  // Require at least a name
  if (!contact.firstName && !contact.lastName && !contact.contactName) {
    return null;
  }

  // Parse contact name if individual names not provided
  let firstName = contact.firstName || '';
  let lastName = contact.lastName || '';
  if (!firstName && !lastName && contact.contactName) {
    const parts = contact.contactName.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  const email = cleanEmail(contact.email) || cleanEmail(contact.secondaryEmail);
  const phone = cleanPhone(contact.phone) || cleanPhone(contact.mobile) || cleanPhone(contact.workPhone);

  // Build comprehensive form_data with ALL Zoho fields
  const formData: Record<string, unknown> = {
    // Zoho identifiers
    zoho_record_id: contact.recordId,
    zoho_contact_owner_id: contact.contactOwnerId,
    zoho_contact_owner: contact.contactOwner,
    zoho_producer_id: contact.producerNameId,
    zoho_producer: contact.producerName,
    
    // Personal info
    title: contact.title,
    salutation: contact.salutation,
    middle_initial: contact.middleInitial,
    date_of_birth: contact.dateOfBirth,
    birth_month: contact.birthMonth,
    gender: contact.primaryMemberGender,
    marital_status: contact.maritalStatus,
    primary_ssn: contact.primarySSNumber,
    tax_id: contact.taxId,
    
    // Address
    address: {
      street: contact.mailingStreet,
      city: contact.mailingCity,
      state: contact.mailingState,
      zip: contact.mailingZip,
    },
    
    // Contact preferences
    secondary_email: contact.secondaryEmail,
    work_phone: contact.workPhone,
    fax: contact.fax,
    mobile: contact.mobile,
    email_opt_out: contact.emailOptOut === 'TRUE',
    preferred_communication: contact.preferredMethodOfCommunication,
    
    // Family members
    family_members: buildFamilyMembers(contact),
    
    // Insurance/Product details
    zoho_status: contact.contactStatus,
    zoho_product: contact.product,
    zoho_carrier: contact.carrier,
    zoho_previous_product: contact.previousProduct,
    zoho_coverage_option: contact.coverageOption,
    zoho_start_date: contact.startDate,
    zoho_cancellation_date: contact.cancellationDate,
    add_on_product: contact.addOnProduct,
    declined: contact.declined,
    charge_waived: contact.chargeWaived,
    vision: contact.vision,
    dental: contact.dental,
    iua_amount: contact.iuaAmount,
    
    // Financial
    amount_received: contact.amountReceived,
    household_annual_adj_gross: contact.householdAnnualAdjGross,
    
    // Referral info
    zoho_referral_source: contact.referralSource,
    referring_member: contact.referringMember,
    mpb_referral_fee: contact.mpbReferralFee,
    referral_requirement_satisfied: contact.referralRequirementSatisfied,
    date_referral_paid: contact.dateReferralPaid,
    
    // Sales/Commission info
    affiliate: contact.affiliate,
    affiliate_referral: contact.affiliateReferral,
    affiliate_rep_monthly: contact.affiliateRepMonthly,
    team_leader: contact.teamLeader,
    team_leader_monthly: contact.teamLeaderMonthly,
    team_leader_referral: contact.teamLeaderReferral,
    director: contact.director,
    director_referral: contact.directorReferral,
    director_monthly: contact.directorMonthly,
    producer_commission: contact.producerCommission,
    commission_percentage: contact.commissionPercentage,
    
    // Life codes
    mpower_life_code: contact.mpowerLifeCode,
    life_code_2nd: contact.lifeCode2nd,
    life_code_3rd: contact.lifeCode3rd,
    life_code_4th: contact.lifeCode4th,
    life_code_5th: contact.lifeCode5th,
    
    // Fulfillment/Onboarding
    welcome_call_performed_by: contact.welcomeCallPerformedBy,
    welcome_call_status: contact.welcomeCallStatus,
    fulfillment_letter_mailed: contact.fulfillmentLetterMailed,
    fulfillment_email_sent: contact.fulfillmentEmailSent,
    complete_date: contact.completeDate,
    mec_submitted: contact.mecSubmitted,
    mec_decision_confirmed: contact.mecDecisionConfirmed,
    select_conversion_completed: contact.selectConversionCompleted,
    
    // Work/Business
    company_association: contact.companyAssociation,
    business_or_practice_name: contact.businessOrPracticeName,
    
    // Analytics/Tracking
    days_visited: contact.daysVisited,
    average_time_spent: contact.averageTimeSpent,
    number_of_chats: contact.numberOfChats,
    most_recent_visit: contact.mostRecentVisit,
    first_visit: contact.firstVisit,
    first_page_visited: contact.firstPageVisited,
    referrer: contact.referrer,
    visitor_score: contact.visitorScore,
    
    // Risk and payments
    risk_assessment_paid: contact.riskAssessmentPaid,
    
    // Portal/DPC
    dpc_name: contact.dpcName,
    cirrus_registration_date: contact.cirrusRegistrationDate,
    mpb_portal_username: contact.mpbPortalUsername,
    mpb_portal_password: contact.mpbPortalPassword,
    
    // Subscription
    unsubscribed_mode: contact.unsubscribedMode,
    unsubscribed_time: contact.unsubscribedTime,
    
    // System/Admin
    admin123: contact.admin123,
    locked: contact.locked,
    enrich_status: contact.enrichStatus,
    
    // App and permissions
    mpb_app_downloaded: contact.mpbAppDownloaded,
    third_party_payor: contact.thirdPartyPayor,
    atap: contact.atap,
    permission_to_discuss_plan: contact.permissionToDiscussPlan,
    medical_release_form_on_file: contact.medicalReleaseFormOnFile,
    
    // Outreach
    wc_outreach_date: contact.wcOutreachDate,
    e123_member_id: contact.e123MemberId,
    
    // Connected records
    connected_to_module: contact.connectedToModule,
    connected_to_id: contact.connectedToId,
    
    // Notes
    notes_history: contact.notesHistory,
    
    // Audit trail
    original_created_by_id: contact.createdById,
    original_created_by: contact.createdBy,
    original_modified_by_id: contact.modifiedById,
    original_modified_by: contact.modifiedBy,
    original_created: contact.createdTime,
    original_modified: contact.modifiedTime,
    last_activity_time: contact.lastActivityTime,
    change_log_time: contact.changeLogTime,
    last_enriched_time: contact.lastEnrichedTime,
    
    // Data processing
    data_processing_basis_id: contact.dataProcessingBasisDetailsId,
    data_processing_basis: contact.dataProcessingBasis,
    data_source: contact.dataSource,
    territories: contact.territories,
    currency: contact.currency,
    exchange_rate: contact.exchangeRate,
    
    // Any extra fields not in our mapping
    extra_fields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
  };

  // Clean up undefined values
  Object.keys(formData).forEach(key => {
    if (formData[key] === undefined || formData[key] === '') {
      delete formData[key];
    }
  });

  // Parse tags
  const tags: string[] = [];
  if (contact.leadSource) {
    tags.push(`source:${contact.leadSource.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
  }
  if (contact.carrier) {
    tags.push(`carrier:${contact.carrier.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
  }
  if (contact.product) {
    tags.push('has-product');
  }
  if (contact.contactStatus) {
    tags.push(`status:${contact.contactStatus.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
  }
  if (contact.tag) {
    tags.push(...contact.tag.split(',').map(t => t.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')).filter(Boolean));
  }
  tags.push('zoho-import');

  return {
    first_name: firstName,
    last_name: lastName,
    email: email || `imported-${contact.recordId || Date.now()}@placeholder.local`,
    phone,
    zip_code: contact.mailingZip,
    current_insurance: contact.carrier,
    monthly_premium: contact.monthlyPremium,
    coverage_preference: contact.coverageOption,
    source_cta: 'zoho-import',
    utm_source: contact.leadSource,
    form_data: formData,
    tags,
  };
}

/**
 * Import contacts from CSV content
 */
export function importContactsFromCSV(
  csvContent: string,
  options: ImportOptions = {}
): ImportResult {
  const result: ImportResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
    leads: [],
  };

  try {
    const rows = parseCSV(csvContent);
    
    if (rows.length < 2) {
      result.errors.push({ row: 0, error: 'CSV file is empty or has no data rows' });
      return result;
    }

    // First row is headers
    const headers = rows[0];
    const { mapping: headerMapping, unmappedHeaders } = mapHeaders(headers);

    console.log(`Mapped ${headerMapping.size} columns, ${unmappedHeaders.size} unmapped columns`);

    if (headerMapping.size === 0) {
      result.errors.push({ 
        row: 0, 
        error: 'No recognized columns found. Expected columns like "First Name", "Last Name", "Email", etc.' 
      });
      return result;
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      result.total++;
      
      try {
        const { contact, extraFields } = parseRow(rows[i], headerMapping, unmappedHeaders);
        const lead = convertToLead(contact, extraFields, options);
        
        if (lead) {
          result.leads.push(lead);
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            row: i + 1,
            error: 'Missing required fields (first name, last name, or contact name)',
            data: contact,
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown parsing error',
        });
      }
    }
  } catch (error) {
    result.errors.push({
      row: 0,
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  return result;
}

/**
 * Get import statistics summary
 */
export function getImportSummary(result: ImportResult): string {
  const lines = [
    `Import Summary:`,
    `  Total rows processed: ${result.total}`,
    `  Successfully parsed: ${result.successful}`,
    `  Failed: ${result.failed}`,
  ];

  if (result.errors.length > 0 && result.errors.length <= 10) {
    lines.push(`  Errors:`);
    result.errors.forEach(e => {
      lines.push(`    Row ${e.row}: ${e.error}`);
    });
  } else if (result.errors.length > 10) {
    lines.push(`  First 10 errors (${result.errors.length} total):`);
    result.errors.slice(0, 10).forEach(e => {
      lines.push(`    Row ${e.row}: ${e.error}`);
    });
  }

  return lines.join('\n');
}

/**
 * Export the column mapping for reference
 */
export function getColumnMapping(): Record<string, string> {
  return { ...COLUMN_MAPPING };
}
