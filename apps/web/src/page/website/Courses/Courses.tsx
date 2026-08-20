import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Leaf,
  LockOpen,
  Play,
  Star,
  Sprout,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COURSESDATA } from "@/helpers/courses";

const Courses = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-0">
        <section className="hidden relative overflow-hidden bg-green-800 px-6 md:px-12 pt-14 pb-24">
          {/* Background blobs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-green-600/30 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-green-700/20 blur-3xl pointer-events-none" />

          <div className="relative max-w-[96%] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              {/* Left */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                  <Leaf className="w-3.5 h-3.5 text-green-300" />
                  <span className="text-green-200 text-xs font-semibold uppercase tracking-widest">
                    Featured Track
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  Organic Farming
                  <span className="block text-green-300">Foundations</span>
                </h1>

                <p className="text-green-200 text-base leading-relaxed mb-8 max-w-lg">
                  Start your organic farming journey with the essentials —
                  Introduction to Organic farming, producing Organic inputs,
                  biofertilizers, biopesticides, and BSFL cultivation.
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap gap-6 mb-8">
                  {[
                    { icon: BookOpen, label: "22 Lessons" },
                    { icon: Users, label: "Beginner Friendly" },
                    { icon: Play, label: "Video Courses" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-green-300" />
                      </div>
                      <span className="text-green-200 text-sm font-medium">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <a href="#course-list">
                    <Button className="bg-white text-green-800 hover:bg-green-50 font-semibold rounded-xl px-6 h-11">
                      Browse courses
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                  {/* <Link to="/signup">
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 rounded-xl px-6 h-11 bg-transparent"
                    >
                      Start learning
                      <BookOpen className="w-4 h-4 ml-2" />
                    </Button>
                  </Link> */}
                </div>
              </div>

              {/* Right — what you'll learn card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-6"
              >
                <p className="text-xs font-semibold text-green-300 uppercase tracking-widest mb-5">
                  What you'll learn
                </p>
                <div className="space-y-3">
                  {[
                    {
                      title: "Soil health & composting",
                      desc: "Master organic soil management",
                    },
                    {
                      title: "Organic inputs production",
                      desc: "Biofertilizers & biopesticides",
                    },
                    {
                      title: "Crops & Livestock farming",
                      desc: "Integrated farming systems",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-4 bg-white/10 rounded-2xl px-4 py-3.5"
                    >
                      <div className="w-9 h-9 rounded-xl bg-green-600/50 flex items-center justify-center flex-shrink-0">
                        <Sprout className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {item.title}
                        </p>
                        <p className="text-green-300 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-green-400 text-xs mt-5 text-center">
                  Delivered via embedded YouTube videos
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section
          id="course-list"
          className="scroll-mt-20 max-w-[96%] mx-auto px-6 md:px-12 mb-20"
        >
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                All Courses
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Browse by category to find the right lesson track.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-sm font-semibold">
                {COURSESDATA.length} courses available
              </span>
            </div>
          </motion.div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COURSESDATA.map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
              >
                <Link to={`/dashboard/courses/${course?.slug}`}>
                  <Card className="group h-full overflow-hidden border border-gray-100 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${course?.Image})` }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/20 transition-colors duration-300" />

                      {/* Play button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-green-800 ml-0.5" />
                        </div>
                      </div>

                      {/* Top badges */}
                      <div className="absolute top-3 left-3">
                        <Badge className="rounded-full bg-[#d17547] text-white text-xs font-semibold shadow-sm">
                          {course.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="rounded-full bg-white text-gray-700 text-xs font-medium shadow-sm inline-flex items-center gap-1">
                          <LockOpen className="w-3 h-3 text-green-600" />
                          Free
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-5">
                      <h3 className="font-bold text-gray-900 text-base mb-3 group-hover:text-green-800 transition-colors line-clamp-2">
                        {course.category}
                      </h3>

                      {/* Meta row */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course?.duration}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {course?.lessons.length}
                            {course?.lessons.length > 1 ? "lessons" : "lesson"}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-yellow-500 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          5.0
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">
                          Start learning
                        </span>
                        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-800 transition-colors">
                          <ArrowRight className="w-3.5 h-3.5 text-green-700 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Courses;
