import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionDivider } from "../webComponents/SectionDivider";
import { SectionHeading } from "../webComponents/SectionHeading";

const faqs = [
  {
    q: "Do I need farming experience to start?",
    a: "No. The courses are structured for beginners and build up from fundamentals like soil health, composting, and farm planning.",
  },
  {
    q: "Are there free courses?",
    a: "Yes. Once you pay the N1,00O yearly platform subscription, all the courses are free. This  includes future courses that will be added subject to research and demand.",
  },
  {
    q: "How do farm slots work?",
    a: "Farm slots are limited practical participation spots. Once you secure a slot, you’ll see the next-step instructions for practice coordination.",
  },
  {
    q: "What happens after I secure a slot?",
    a: "You’ll receive confirmation and guidance on joining the coordination channel (WhatsApp group link) to prepare for the practical sessions.",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Absolutely. Learn when it fits your schedule and revisit lessons anytime. And with our learn by doing (practice) model, everything you learn stays with you forever.",
  },
];

export function FAQSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <SectionDivider position="top" className="text-background" />
      <SectionDivider position="bottom" className="text-background" />
      <div
        className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <SectionHeading align="left" eyebrow="" title="" description="" />
            <span className="inline-flex text-green-800 items-center gap-2 font-semibold text-sm uppercase tracking-wider">
              Support
            </span>
            <h2 className="text-3xl font-normal text-foreground mt-4 leading-[1.1]">
              FAQ
            </h2>
            <p className="text-green-900 text-[16px] mt-4 max-w-2xl">
              Quick answers to the most common questions—so you can confidently
              explore the courses.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 md:p-4 shadow-elevated">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqs.map((f, idx) => (
                  <AccordionItem
                    key={f.q}
                    value={`faq-${idx}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated data-[state=open]:border-accent/30 data-[state=open]:ring-1 data-[state=open]:ring-accent/20 data-[state=open]:shadow-elevated motion-reduce:transition-none motion-reduce:hover:transform-none"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100 group-data-[state=open]:opacity-100 group-data-[state=open]:blur-3xl motion-reduce:transition-none"
                    />
                    <AccordionTrigger className="px-4 md:px-5 text-left hover:no-underline">
                      <span className="font-medium text-foreground">{f.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 md:px-5 text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
