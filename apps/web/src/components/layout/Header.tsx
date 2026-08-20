import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgrohealImages } from "@/constant/Image";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Courses", href: "/dashboard/courses" },
  { name: "Farm Slots", href: "/dashboard/slots" },
  { name: "About", href: "/about" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navClassName = useMemo(
    () =>
      [
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        isScrolled
          ? "bg-background text-green-800 border-b border-border"
          : "bg-black/10 text-white border-b border-transparent",
      ].join(" "),
    [isScrolled],
  );

  return (
    <nav className={navClassName}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            {/* <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className=" text-xl font-semibold text-foreground">
              Agroheal
            </span> */}
            <img src={AgrohealImages.HeaderLogo} alt="" className="w-40" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="relative group px-3 py-2 -mx-3 rounded-full font-medium transition-colors motion-reduce:transition-none"
              >
                {/* Cinematic hover pill */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full bg-accent/20 border border-border/50 opacity-0 scale-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 motion-reduce:transition-none motion-reduce:transform-none"
                />
                <span className="inline-flex items-center gap-2">
                  {link.name}
                  {link.href === "/courses" && (
                    <span className="inline-flex items-center rounded-full bg-[#e8b130]/20 border border-[#e8b130]/30 px-2 py-0.5 text-xs font-semibold text-[#e8b130]">
                      Start here
                    </span>
                  )}
                </span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full motion-reduce:transition-none" />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button className="bg-green-800 text-white">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-green-800 text-white">Get started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden overflow-hidden ${isScrolled ? "bg-white p-4" : "bg-white p-4 rounded-xl"}`}
            >
              <div className="py-4 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block py-2 text-foreground/90 font-medium hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="pt-4 flex flex-col gap-3">
                  <Link to="/login" className="w-full">
                    <Button className="w-full bg-green-800 text-white">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button className="w-full bg-green-800 text-white">
                      Get started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
