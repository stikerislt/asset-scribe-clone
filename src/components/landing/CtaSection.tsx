
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export const CtaSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-4xl font-bold tracking-tight">
            Ready to transform your asset management?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join organizations that trust us to manage millions in assets. Start your journey to better asset management today.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link to="/auth/signup">
                <Rocket className="mr-2 h-5 w-5" />
                Get Started Now
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
