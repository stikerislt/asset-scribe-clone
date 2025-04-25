
import { motion } from "framer-motion";
import { Star, Users, Award } from "lucide-react";

const testimonials = [
  {
    quote: "This platform has transformed how we manage our IT assets. The real-time tracking is invaluable.",
    author: "Sarah Chen",
    role: "IT Director",
    company: "TechCorp Inc.",
    icon: Star,
  },
  {
    quote: "The maintenance scheduling and status monitoring features have saved us countless hours.",
    author: "Michael Rodriguez",
    role: "Operations Manager",
    company: "Global Solutions",
    icon: Users,
  },
  {
    quote: "Best asset management solution we've used. The analytics help us make better decisions.",
    author: "Emma Thompson",
    role: "Asset Manager",
    company: "Innovation Labs",
    icon: Award,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Trusted by teams everywhere</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what organizations are saying about our asset management solution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 rounded-lg border bg-card"
            >
              <testimonial.icon className="w-6 h-6 text-primary mb-4" />
              <blockquote className="mb-4 text-muted-foreground">
                "{testimonial.quote}"
              </blockquote>
              <footer>
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}, {testimonial.company}
                </div>
              </footer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
