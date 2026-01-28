import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCRM } from '../contexts/CRMContext';
import { PrintDocumentLayout, LineItemRow } from '../components/print/PrintDocumentLayout';
import type { QuoteWithRelations } from '@mpbhealth/crm-core';

export default function QuotePrintView() {
  const { id } = useParams<{ id: string }>();
  const { quoteService } = useCRM();
  const [quote, setQuote] = useState<QuoteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      if (!id) {
        setError('Quote ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = await quoteService.getQuote(id);
        if (data) {
          setQuote(data);
        } else {
          setError('Quote not found');
        }
      } catch (err) {
        console.error('Error loading quote:', err);
        setError('Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [id, quoteService]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Quote not found'}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const contactName = quote.contact
    ? `${quote.contact.first_name} ${quote.contact.last_name}`
    : null;

  return (
    <PrintDocumentLayout
      documentType="Quote"
      documentNumber={quote.quote_number}
      documentDate={quote.created_at}
      dueDate={quote.valid_until}
      status={quote.status}
      customerName={quote.account?.name || 'N/A'}
      customerContact={contactName}
      customerEmail={quote.contact?.email}
      billingAddress={quote.billing_address as Record<string, string>}
      shippingAddress={quote.shipping_address as Record<string, string>}
      subtotal={quote.subtotal}
      discountPercent={quote.discount_percent}
      discountAmount={quote.discount_amount}
      taxAmount={quote.tax_amount}
      shippingAmount={quote.shipping_amount}
      total={quote.total}
      currency={quote.currency}
      termsAndConditions={quote.terms_and_conditions}
      notes={quote.notes}
      lineItems={
        quote.line_items && quote.line_items.length > 0 ? (
          quote.line_items
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <LineItemRow
                key={item.id}
                name={item.name}
                description={item.description}
                quantity={item.quantity}
                unitPrice={item.unit_price}
                total={item.total}
                currency={quote.currency}
              />
            ))
        ) : (
          <tr>
            <td colSpan={5} className="py-8 text-center text-gray-500">
              No line items
            </td>
          </tr>
        )
      }
    >
      {/* Additional quote-specific info */}
      {quote.deal && (
        <div className="text-sm">
          <span className="text-gray-500">Related Deal:</span>
          <p className="font-medium text-gray-900">{quote.deal.name}</p>
        </div>
      )}
      {quote.owner && (
        <div className="text-sm mt-2">
          <span className="text-gray-500">Sales Rep:</span>
          <p className="font-medium text-gray-900">
            {quote.owner.full_name || quote.owner.email}
          </p>
        </div>
      )}
    </PrintDocumentLayout>
  );
}
