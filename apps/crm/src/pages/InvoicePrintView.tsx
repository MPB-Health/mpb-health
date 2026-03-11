import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCRM } from '../contexts/CRMContext';
import { PrintDocumentLayout, LineItemRow } from '../components/print/PrintDocumentLayout';
import type { InvoiceWithRelations } from '@mpbhealth/crm-core';

export default function InvoicePrintView() {
  const { id } = useParams<{ id: string }>();
  const { invoiceService } = useCRM();
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setError('Invoice ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = await invoiceService.getInvoice(id);
        if (data) {
          setInvoice(data);
        } else {
          setError('Invoice not found');
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id, invoiceService]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-th-text-secondary">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Invoice not found'}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-surface-tertiary text-th-text-primary rounded-lg hover:bg-surface-tertiary/80"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const contactName = invoice.contact
    ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
    : null;

  return (
    <PrintDocumentLayout
      documentType="Invoice"
      documentNumber={invoice.invoice_number}
      documentDate={invoice.issue_date}
      dueDate={invoice.due_date}
      status={invoice.status}
      customerName={invoice.account?.name || 'N/A'}
      customerContact={contactName}
      customerEmail={invoice.contact?.email}
      billingAddress={invoice.billing_address as Record<string, string>}
      shippingAddress={invoice.shipping_address as Record<string, string>}
      subtotal={invoice.subtotal}
      discountPercent={invoice.discount_percent}
      discountAmount={invoice.discount_amount}
      taxAmount={invoice.tax_amount}
      shippingAmount={invoice.shipping_amount}
      total={invoice.total}
      amountPaid={invoice.amount_paid}
      amountDue={invoice.amount_due}
      currency={invoice.currency}
      termsAndConditions={invoice.terms_and_conditions}
      notes={invoice.notes}
      lineItems={
        invoice.line_items && invoice.line_items.length > 0 ? (
          invoice.line_items
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <LineItemRow
                key={item.id}
                name={item.name}
                description={item.description}
                quantity={item.quantity}
                unitPrice={item.unit_price}
                total={item.total}
                currency={invoice.currency}
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
      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="text-left">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Payments Received
          </h4>
          <div className="space-y-1">
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="text-sm">
                <span className="text-gray-600">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </span>
                <span className="ml-2 font-medium text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(payment.amount)}
                </span>
                {payment.payment_method && (
                  <span className="ml-1 text-gray-500">({payment.payment_method})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Quote */}
      {invoice.quote && (
        <div className="text-sm mt-4">
          <span className="text-gray-500">From Quote:</span>
          <p className="font-medium text-gray-900">#{invoice.quote.quote_number}</p>
        </div>
      )}

      {/* Related Deal */}
      {invoice.deal && (
        <div className="text-sm mt-2">
          <span className="text-gray-500">Related Deal:</span>
          <p className="font-medium text-gray-900">{invoice.deal.name}</p>
        </div>
      )}
    </PrintDocumentLayout>
  );
}
