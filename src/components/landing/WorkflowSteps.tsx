
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const steps = [
  {
    title: "Add Assets",
    description: "Quickly add and categorize your organization's assets with our intuitive interface.",
  },
  {
    title: "Assign & Track",
    description: "Assign assets to employees and track their status in real-time.",
  },
  {
    title: "Monitor & Maintain",
    description: "Get insights on asset utilization and maintenance needs through powerful analytics.",
  },
];

export const WorkflowSteps = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple, intuitive asset management workflow designed for modern organizations
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                <div className="text-center max-w-xl mx-auto">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowDown className="w-6 h-6 text-muted-foreground my-6" />
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
