import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-accent animate-float" />
        <div
          className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-accent animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-primary-foreground animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-8">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>

          <h2 className=" text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Together we can cut food costs by over 50%
          </h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Invite your friends to join the challenge. For every person that
            signs up using your referral code, you earn ₦1,000 instantly. Grow
            your income while farming to cut food costs!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="w-fit bg-[#ffffff] text-green-800 hover:bg-white/90 p-6 rounded-full"
            >
              <Link to="/signup" className="gap-2">
                Get Started Now
                {/* <ArrowRight className="w-5 h-5" /> */}
              </Link>
            </Button>
            {/* <Button size={"lg"} asChild>
              <Link to="/dashboard/courses">Explore Courses</Link>
            </Button> */}
          </div>

          {/* <p className="text-primary-foreground/60 text-sm mt-6">
            No credit card required • Free courses available
          </p> */}
        </motion.div>
      </div>
    </section>
  );
}
