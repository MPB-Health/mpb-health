import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lightbulb,
  BookOpen,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@mpbhealth/ui';
import { Modal } from '../Modal';
import { getPageHelp } from '../../help/registry';
import { HelpSearch } from './HelpSearch';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageHelp = getPageHelp(location.pathname);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pageHelp?.title ?? 'Help'}
      description={pageHelp?.description ?? 'Get help with the current page.'}
      variant="slideOver"
      size="md"
    >
      <div className="space-y-6">
        {/* Search */}
        <HelpSearch
          onSelectArticle={(articleId) => {
            onClose();
            navigate(`/learning-center/${articleId}`);
          }}
        />

        {pageHelp ? (
          <>
            {/* Quick Tips */}
            {pageHelp.quickTips.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-th-text-primary mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Quick Tips
                </h3>
                <ul className="space-y-2">
                  {pageHelp.quickTips.map((tip) => (
                    <li
                      key={tip.id}
                      className="flex items-start gap-2.5 text-sm text-th-text-secondary"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Field Hints */}
            {pageHelp.fieldHints.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-th-text-primary mb-3">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  Field Guide
                </h3>
                <div className="space-y-2">
                  {pageHelp.fieldHints.map((hint) => (
                    <div
                      key={hint.fieldKey}
                      className="rounded-lg border border-th-border bg-surface-secondary p-3"
                    >
                      <p className="text-xs font-medium text-th-text-primary">
                        {hint.label}
                      </p>
                      <p className="text-xs text-th-text-tertiary mt-0.5">
                        {hint.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {pageHelp.faqs.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-th-text-primary mb-3">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  Frequently Asked Questions
                </h3>
                <Accordion type="single" className="space-y-1.5">
                  {pageHelp.faqs.map((faq, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`faq-${idx}`}
                      className="border-th-border bg-surface-secondary"
                    >
                      <AccordionTrigger className="text-xs font-medium text-th-text-primary py-3 px-3 hover:bg-surface-tertiary">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-th-text-secondary px-3 pb-3">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {/* Related articles */}
            {pageHelp.relatedArticles.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-th-text-primary mb-3">
                  Related Guides
                </h3>
                <div className="space-y-1.5">
                  {pageHelp.relatedArticles.map((articleId) => (
                    <button
                      key={articleId}
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/learning-center/${articleId}`);
                      }}
                      className="w-full flex items-center gap-2 text-xs text-th-accent-600 dark:text-th-accent-400 hover:underline text-left py-1"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {articleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <HelpCircle className="w-10 h-10 text-th-text-tertiary/40 mx-auto mb-3" />
            <p className="text-sm text-th-text-tertiary">
              No specific help available for this page yet.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/learning-center');
              }}
              className="mt-3 text-sm text-th-accent-600 dark:text-th-accent-400 hover:underline"
            >
              Browse the Learning Center
            </button>
          </div>
        )}

        {/* Learning Center link */}
        <div className="pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/learning-center');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-th-accent-600 hover:bg-th-accent-700 text-white text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Open Learning Center
          </button>
        </div>
      </div>
    </Modal>
  );
}
