
import { motion } from "framer-motion";
import { Database, Users, BarChart3, CalendarClock } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Asset Tracking",
    description: "Keep track of all your organization's assets in one centralized system. Monitor status, location, and assignments effortlessly."
  },
  {
    icon: Users,
    title: "User Management",
    description: "Manage employees and their assigned assets with role-based access control. Track who has what and maintain accountability."
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Get real-time insights into asset utilization, maintenance schedules, and cost analysis with powerful dashboard analytics."
  },
  {
    icon: CalendarClock,
    title: "Status Monitoring",
    description: "Monitor asset status with color-coded indicators. Stay on top of maintenance needs and potential issues."
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to manage assets</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to give you complete control and visibility over your organization's assets.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 rounded-lg border bg-card"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
