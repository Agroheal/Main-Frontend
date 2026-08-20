import { motion } from "framer-motion";
import { BookOpen, Sprout, Users, CreditCard, GraduationCap, Rocket } from "lucide-react";

const roadmapSteps = [
  {
    title: "Step 1: Learn on the Platform",
    description:
      "Start with the course modules to understand organic farming principles and practical techniques.",
    icon: BookOpen,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  {
    title: "Step 2: Join the Community",
    description:
      "Use the LEAP Community card to join live trainings, ask questions, and receive updates.",
    icon: Users,
    color: "text-[#229ED9]",
    bg: "bg-[#e8f4ff]",
  },
  {
    title: "Step 3: Secure Practice Slots",
    description:
      "Use Farm Slots for Practicals to reserve and track your practical farm participation slots.",
    icon: Sprout,
    color: "text-[#d17547]",
    bg: "bg-orange-50",
  },
  {
    title: "Step 4: Pay for Farm Setup Fee and Farm Support Fee",
    description:
      "Pay your Farm Setup Fee and Farm Support Fee in the Other Payments section. These fees are required to activate your farm group and cover ongoing technical support and infrastructure.",
    icon: CreditCard,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  {
    title: "Step 5: Grow With Referrals",
    description:
      "Share your referral link from the dashboard to invite others and grow your affiliate earnings.",
    icon: Rocket,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
];

const RoadmapGuide = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-[96%] mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 mb-3">
            <GraduationCap className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white">Navigation Guide</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Website Roadmap
          </h1>
          <p className="text-green-100 mt-2 text-sm md:text-base max-w-3xl">
            Follow this roadmap to understand each section of your dashboard and how
            to move from learning to practical farm application.
          </p>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-[96%] mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-8">
          <div className="space-y-4">
            {roadmapSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="relative rounded-2xl border border-gray-100 bg-white p-4 sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}
                    >
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    {index < roadmapSteps.length - 1 && (
                      <div className="w-0.5 h-10 bg-gray-200 mt-2" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">
                      {step.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapGuide;
