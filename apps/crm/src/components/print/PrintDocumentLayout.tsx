import { ReactNode } from 'react';

interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  [key: string]: unknown;
}

interface PrintDocumentLayoutProps {
  documentType: 'Quote' | 'Invoice' | 'Sales Order' | 'Purchase Order';
  documentNumber: string;
  documentDate?: string | null;
  dueDate?: string | null;
  status: string;
  customerName: string;
  customerContact?: string | null;
  customerEmail?: string | null;
  billingAddress?: AddressInfo;
  shippingAddress?: AddressInfo;
  lineItems: ReactNode;
  subtotal: number;
  discountPercent?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  shippingAmount?: number | null;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currency?: string;
  termsAndConditions?: string | null;
  notes?: string | null;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  children?: ReactNode;
}

export function PrintDocumentLayout({
  documentType,
  documentNumber,
  documentDate,
  dueDate,
  status,
  customerName,
  customerContact,
  customerEmail,
  billingAddress,
  shippingAddress,
  lineItems,
  subtotal,
  discountPercent,
  discountAmount,
  taxAmount,
  shippingAmount,
  total,
  amountPaid,
  amountDue,
  currency = 'USD',
  termsAndConditions,
  notes,
  companyName = 'MPB Health',
  companyAddress = '123 Business St, Suite 100, City, ST 12345',
  companyPhone = '(555) 123-4567',
  companyEmail = 'billing@mpbhealth.com',
  children,
}: PrintDocumentLayoutProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAddress = (addr: AddressInfo | undefined) => {
    if (!addr) return null;
    const parts = [
      addr.street,
      [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
      addr.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts : null;
  };

  const billingLines = formatAddress(billingAddress);
  const shippingLines = formatAddress(shippingAddress);

  return (
    <div className="print-document bg-white min-h-screen">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-document {
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
        @media screen {
          .print-document {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Print Button (hidden in print) */}
      <div className="no-print fixed top-4 right-4 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Print Document
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          Close
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{companyName}</h1>
          <p className="text-sm text-gray-600">{companyAddress}</p>
          <p className="text-sm text-gray-600">Phone: {companyPhone}</p>
          <p className="text-sm text-gray-600">Email: {companyEmail}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 uppercase mb-2">{documentType}</h2>
          <p className="text-lg font-semibold text-gray-700">#{documentNumber}</p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Date:</span> {formatDate(documentDate)}
          </p>
          {dueDate && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">
                {documentType === 'Quote' ? 'Valid Until:' : 'Due Date:'}
              </span>{' '}
              {formatDate(dueDate)}
            </p>
          )}
          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase ${
                status === 'paid' || status === 'accepted' || status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : status === 'overdue' || status === 'rejected' || status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : status === 'sent' || status === 'pending'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Address Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Bill To
          </h3>
          <p className="font-semibold text-gray-900">{customerName}</p>
          {customerContact && <p className="text-sm text-gray-600">{customerContact}</p>}
          {customerEmail && <p className="text-sm text-gray-600">{customerEmail}</p>}
          {billingLines && billingLines.map((line, i) => (
            <p key={i} className="text-sm text-gray-600">{line}</p>
          ))}
        </div>
        {shippingLines && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Ship To
            </h3>
            {shippingLines.map((line, i) => (
              <p key={i} className="text-sm text-gray-600">{line}</p>
            ))}
          </div>
        )}
        <div className="text-right">
          {children}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                Item
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                Description
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                Qty
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                Unit Price
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>{lineItems}</tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-72">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {(discountPercent || discountAmount) && (
            <div className="flex justify-between py-2 text-sm text-green-600">
              <span>
                Discount
                {discountPercent ? ` (${discountPercent}%)` : ''}
              </span>
              <span>-{formatCurrency(discountAmount || (subtotal * (discountPercent || 0)) / 100)}</span>
            </div>
          )}
          {taxAmount !== null && taxAmount !== undefined && taxAmount > 0 && (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          {shippingAmount !== null && shippingAmount !== undefined && shippingAmount > 0 && (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">{formatCurrency(shippingAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-300 mt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {amountPaid !== undefined && amountPaid > 0 && (
            <>
              <div className="flex justify-between py-2 text-sm text-green-600">
                <span>Amount Paid</span>
                <span>{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold text-blue-600">
                <span>Balance Due</span>
                <span>{formatCurrency(amountDue || 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes & Terms */}
      {(notes || termsAndConditions) && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          {notes && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
            </div>
          )}
          {termsAndConditions && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Terms & Conditions
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{termsAndConditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        <p className="mt-1">
          {companyName} • {companyPhone} • {companyEmail}
        </p>
      </div>
    </div>
  );
}

interface LineItemRowProps {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  currency?: string;
}

export function LineItemRow({
  name,
  description,
  quantity,
  unitPrice,
  total,
  currency = 'USD',
}: LineItemRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-4 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{description || '-'}</td>
      <td className="py-3 px-4 text-sm text-gray-900 text-right">{quantity}</td>
      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(unitPrice)}</td>
      <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
        {formatCurrency(total)}
      </td>
    </tr>
  );
}
