
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box, Package, Infinity } from "lucide-react";

export const PricingSection = () => {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that best fits your organization's needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative p-6 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-4 mb-4">
              <Box className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Free</h3>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold">€0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Up to 150 assets
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Basic asset tracking
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Core analytics
              </li>
            </ul>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/auth/signup">Get Started</Link>
            </Button>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative p-6 rounded-lg border bg-card ring-2 ring-primary"
          >
            <div className="absolute -top-3 right-4">
              <span className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground">
                Popular
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Package className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Pro</h3>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold">€4.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Up to 500 assets
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Advanced tracking features
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Full analytics suite
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Priority support
              </li>
            </ul>
            <Button className="w-full" asChild>
              <Link to="/auth/signup">Upgrade to Pro</Link>
            </Button>
          </motion.div>

          {/* Enterprise Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="relative p-6 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-4 mb-4">
              <Infinity className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Enterprise</h3>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold">Custom</span>
              <span className="text-muted-foreground"> pricing</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Unlimited assets
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Custom integration
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                Dedicated support
              </li>
              <li className="flex items-center text-muted-foreground">
                <span className="mr-2">•</span>
                SLA guarantees
              </li>
            </ul>
            <Button className="w-full" variant="outline" asChild>
              <Link to="mailto:contact@example.com">Contact Sales</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
