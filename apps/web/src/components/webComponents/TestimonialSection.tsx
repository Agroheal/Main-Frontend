import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SectionDivider } from "../webComponents/SectionDivider";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Amina O.",
    title: "Beginner farmer",
    quote:
      "The lessons are clear and practical. I finally understood composting and soil health in a way I can apply immediately.",
  },
  {
    name: "Chinedu K.",
    title: "Aspiring agropreneur",
    quote:
      "I liked the Learn → Practice → Earn path. It feels structured, not overwhelming, and keeps me focused.",
  },
  {
    name: "Tosin A.",
    title: "Career switcher",
    quote:
      "Seeing the course preview and what comes next made it easy to commit. The platform feels premium and trustworthy.",
  },
  {
    name: "Grace M.",
    title: "Community member",
    quote:
      "The community energy is strong—once you start learning, it’s easy to keep going. I’m excited for farm practice.",
  },
];

function TestimonialCard({
  name,
  title,
  quote,
}: (typeof testimonials)[number]) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <Card className="group relative h-full overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated motion-reduce:transition-none motion-reduce:hover:transform-none">
      <CardContent className="p-6 relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border bg-background/50">
              <AvatarFallback className="text-sm font-semibold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {name}
              </div>
              <div className="text-xs text-muted-foreground">{title}</div>
            </div>
          </div>
          <Quote className="h-5 w-5 text-[#e8b130]" aria-hidden="true" />
        </div>

        <p className="mt-4 text-sm md:text-base leading-relaxed text-foreground/80">
          “{quote}”
        </p>

        <div
          className="mt-5 flex items-center gap-1 text-accent"
          aria-label="5 out of 5 stars"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 text-[#e8b130]" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <SectionDivider position="top" className="text-background" />
      <SectionDivider position="bottom" className="text-background" />
      <div
        className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl">
          <span className="inline-flex text-green-800 items-center gap-2 font-semibold text-sm uppercase tracking-wider">
            <span
              className="h-2 w-2 rounded-full bg-accent"
              aria-hidden="true"
            />
            Testimonials
          </span>
          <h2 className="text-3xl font-normal text-foreground mt-4 leading-[1.1]">
            Loved by learners
          </h2>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid mt-10 grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: idx * 0.05 }}
              className="h-full"
            >
              <TestimonialCard {...t} />
            </motion.div>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden mt-10">
          <Carousel opts={{ align: "start", loop: true }} className="relative">
            <CarouselContent>
              {testimonials.map((t) => (
                <CarouselItem key={t.name} className="basis-[88%]">
                  <TestimonialCard {...t} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 top-[45%]" />
            <CarouselNext className="-right-4 top-[45%]" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
