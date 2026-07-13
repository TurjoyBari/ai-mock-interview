"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureFaq } from "@/data/features";

export function FeatureFaqList({ faqs }: { faqs: FeatureFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby="faq-heading" className="space-y-6">
      <div>
        <h2 id="faq-heading" className="text-2xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-muted-foreground">
          Quick answers about how this feature works.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="border-t border-border/50 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
