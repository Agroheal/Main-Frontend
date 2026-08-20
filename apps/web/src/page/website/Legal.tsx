import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Leaf,
  ScrollText,
  Shield,
  Users,
  DollarSign,
  RefreshCw,
} from "lucide-react";

const sections = [
  {
    id: 1,
    icon: ScrollText,
    title: "Goal",
    clause: "Clause 1",
    content: [
      {
        label: "a. Learn",
        text: "Complete the LEAP learning modules in full.",
      },
      {
        label: "b. Practice",
        text: "Engage the LEAP Group Farming Template to produce the organic inputs, crops and livestock taught in the LEAP modules.",
      },
      {
        label: "c. Earn",
        text: "A potential return on the amount contributed for farm establishment. Returns are estimated at 100% biannually (twice yearly or every six months) to take effect fully by the second season/cycle of six months. The first season shall be for farm establishment.",
      },
    ],
  },
  {
    id: 2,
    icon: Users,
    title: "Structure",
    clause: "Clause 2",
    content: [
      {
        label: "a. Shared Land",
        text: "All organic inputs, crops and livestock contained in the LEAP Modules will be cultivated within a framework of Co-operative farming.",
      },
      {
        label: "b. Collective Cultivation",
        text: "LEAP is structured to allow participants to implement (through cooperative, coordinated and concerted effort) what they have learnt on the Platform.",
      },
      {
        label: "c. Management",
        text: "Participants shall lease, democratically control and are responsible for their Group farm jointly and severally, and shall work according to the LEAP Group farm template as led by Agroheal and its expert consultants through an elected management (consisting of at least a Coordinator, Secretary and Treasurer).",
      },
      {
        label: "d. Decision-making",
        text: "Participants shall participate in decision-making through meetings, voting, and other forms of engagement via a WhatsApp group formed specifically for the purpose.",
      },
      {
        label: "e. Farm Supervision",
        text: "A Farm Supervisor (who shall reside on the farm site) will oversee day-to-day garden operations and post reports on the community WhatsApp group.",
      },
    ],
  },
  {
    id: 3,
    icon: DollarSign,
    title: "Cost of Participation",
    clause: "Clause 3",
    content: [
      {
        label: "a. Admin Fee",
        text: "₦2,000 yearly admin fee per slot.",
      },
      {
        label: "b. Farm Purse",
        text: "₦5,000 monthly contribution to the Group Farm purse for farm set-up over the first 5 months: ₦25,000 total per slot.",
      },
      {
        label: "c. Labour",
        text: "One day (eight hours) a month work rotation per slot or option of ₦500 fine to pay a substitute to do your work.",
      },
      {
        label: "d. Agroheal farm support",
        text: "₦500 monthly payment for Agroheal Farm support and farm estate oversight.",
      },
    ],
  },
  {
    id: 4,
    icon: RefreshCw,
    title: "Amendments",
    clause: "Clause 4",
    content: [
      {
        label: "",
        text: "This Agreement may be amended/updated from time-to-time with terms, conditions, rules and regulations as deemed necessary to ensure achievement of the stated LEAP Goal in Clause 1 and in light of prevailing economic realities.",
      },
    ],
  },
];

function AccordionSection({
  section,
  index,
}: {
  section: (typeof sections)[0];
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="border border-green-800/20 rounded-2xl overflow-hidden bg-white shadow-sm"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-800/10 flex items-center justify-center group-hover:bg-green-800/20 transition-colors">
            <Icon className="w-5 h-5 text-green-800" />
          </div>
          <div>
            <span className="text-xs font-semibold text-green-700 uppercase tracking-widest block">
              {section.clause}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {section.title}
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-green-800" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 space-y-4 border-t border-green-800/10 pt-4">
              {section.content.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-700 mt-2 flex-shrink-0" />
                  <div>
                    {item.label && (
                      <span className="font-semibold text-green-900 text-sm">
                        {item.label} —{" "}
                      </span>
                    )}
                    <span className="text-gray-600 text-sm leading-relaxed">
                      {item.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const Legal = () => {
  return (
    <div className="min-h-screen bg-[#f8faf8]">
      {/* Header */}
      <div className="bg-green-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/80 font-medium text-sm uppercase tracking-widest">
                Agroheal Solutions Ltd.
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              Learn to Earn Agribusiness Program
            </h1>
            <p className="text-green-200 text-lg font-medium mb-1">
              Group Practicals Agreement
            </p>
            <div className="w-16 h-0.5 bg-green-400 mx-auto mt-4" />
          </motion.div>
        </div>
      </div>

      {/* Preamble */}
      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-green-800/10 p-6 md:p-8 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-green-800" />
            <span className="text-xs font-bold text-green-800 uppercase tracking-widest">
              Preamble
            </span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            This Agreement is made between{" "}
            <span className="font-semibold text-green-900">
              Agroheal Solutions Ltd.
            </span>{" "}
            and the Participants of the LEAP Group farms.
          </p>

          <div className="space-y-3">
            {[
              "Agroheal is dedicated to providing solutions that make smallholder farming easy, sustainable, and profitable. The LEAP is aimed at instruction in organic farming and mobilizing smallholder cooperation towards national food security and economic diversification.",
              "The LEAP consists of learning modules containing step-by-step instructions on how to produce organic inputs and cultivate a wide range of crops and livestock.",
              "The LEAP Group Farm Model is structured by Agroheal to facilitate a practical application of the lessons taught in the LEAP modules.",
              "The undersigned Participant is desirous of engaging the Group Farming structure to practicalize their learning and enjoy the benefits as itemized below.",
            ].map((text, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-bold text-green-700 mt-0.5 flex-shrink-0">
                  {String.fromCharCode(97 + i)}.
                </span>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Terms heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-5"
        >
          <p className="text-xs font-bold text-green-800 uppercase tracking-widest">
            The Parties Have Agreed to Be Bound by the Following Terms and
            Conditions
          </p>
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-3 mb-8">
          {sections.map((section, index) => (
            <AccordionSection
              key={section.id}
              section={section}
              index={index}
            />
          ))}
        </div>

        {/* Agreement Footer f*/}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-green-800 text-white rounded-2xl p-6 md:p-8 mb-12 text-center"
        >
          <Leaf className="w-8 h-8 text-green-300 mx-auto mb-4" />
          <p className="text-green-100 text-sm leading-relaxed max-w-xl mx-auto">
            By payment of a farm slot(s) admin fee, I signify my agreement to
            the terms of participation in the{" "}
            <span className="font-semibold text-white">
              LEAP Group Practicals
            </span>{" "}
            as contained in Clauses 1–4 above.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Legal;
