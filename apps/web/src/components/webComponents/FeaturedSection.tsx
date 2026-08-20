import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionDivider } from "../webComponents/SectionDivider";
import { SectionHeading } from "../webComponents/SectionHeading";
import { COURSESDATA } from "@/helpers/courses";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function FeaturedCoursesSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <SectionDivider position="top" className="text-background" />
      <SectionDivider position="bottom" className="text-background" />
      <div
        className="absolute inset-0 bg-gradient-to-b from-background via-[#f4e2d9] to-background"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <SectionHeading
              align="left"
              eyebrow="Featured Courses"
              title="Start with these beginner-friendly courses"
              description="Fast, practical lessons designed to help you build real skills—then step into farm practice when you’re ready."
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="lg:col-span-5 flex lg:justify-end"
          >
            <Button
              variant="default"
              size="lg"
              asChild
              className="w-full sm:w-auto bg-gradient-cta text-primary-foreground font-semibold shadow-elevated hover:shadow-glow hover:scale-105"
            >
              <Link to="/dashboard/courses" className="gap-2">
                Explore all courses
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid mt-10 grid-cols-2 lg:grid-cols-4 gap-6">
          {COURSESDATA.slice(0, 4).map((c, idx) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: idx * 0.05 }}
              className="h-full"
            >
              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated motion-reduce:transition-none motion-reduce:hover:transform-none">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div>
                        <img src={c?.Image} alt="course_images" />
                      </div>
                      <CardTitle className="mt-4  text-2xl">
                        {c?.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
                  />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {c?.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <PlayCircle className="h-5 w-5 text-primary" />
                      Watch preview
                    </span>
                    <Button variant="ghost" asChild className="gap-2">
                      <Link to="/dashboard/courses">
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden mt-10">
          <Carousel opts={{ align: "start", loop: true }} className="relative">
            <CarouselContent>
              {COURSESDATA.slice(0, 4).map((c) => (
                <CarouselItem key={c.title} className="basis-[88%]">
                  <Card className="group relative h-full overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated motion-reduce:transition-none motion-reduce:hover:transform-none">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div>
                            <img src={c?.Image} alt="course_images" />
                          </div>
                          <CardTitle className="mt-4  text-2xl">
                            {c?.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 relative">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none"
                      />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {c?.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                          <PlayCircle className="h-5 w-5 text-primary" />
                          Watch preview
                        </span>
                        <Button variant="ghost" asChild className="gap-2">
                          <Link to="/dashboard/courses">
                            View
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
