/**
 * Company Contact Information Configuration
 *
 * Centralized configuration for MPB Health company contact details.
 * Used across About, Contact, Features pages and anywhere office info is displayed.
 */

export interface CompanyContact {
  officeName: string;
  officeAddress: string;
  officeCity: string;
  officeState: string;
  officeZip: string;
  officePhone: string;
  officeEmail: string;
  officeMapsUrl: string;
  officeHours: string;
}

export const COMPANY_CONTACT: CompanyContact = {
  officeName: 'MPB Health',
  officeAddress: '5301 N Federal Hwy, Suite 155',
  officeCity: 'Boca Raton',
  officeState: 'FL',
  officeZip: '33487',
  officePhone: '(855) 816-4650',
  officeEmail: 'info@mpbhealth.com',
  officeMapsUrl: 'https://maps.google.com/?q=5301+N+Federal+Hwy+Suite+155+Boca+Raton+FL+33487',
  officeHours: 'Monday - Friday: 9:00 AM - 6:00 PM ET',
};

/**
 * Get formatted full address as single string
 */
export const getFullAddress = (): string => {
  return `${COMPANY_CONTACT.officeAddress}, ${COMPANY_CONTACT.officeCity}, ${COMPANY_CONTACT.officeState} ${COMPANY_CONTACT.officeZip}`;
};

/**
 * Get phone number in tel: link format (digits only)
 */
export const getPhoneLink = (): string => {
  return `tel:${COMPANY_CONTACT.officePhone.replace(/\D/g, '')}`;
};

/**
 * Get mailto link
 */
export const getEmailLink = (): string => {
  return `mailto:${COMPANY_CONTACT.officeEmail}`;
};
