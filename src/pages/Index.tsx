
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/landing/GradientText";
import { Features } from "@/components/landing/Features";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-20 md:pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Better way to manage <GradientText>company assets</GradientText>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Streamline your organization's asset tracking. From IT equipment to office supplies, 
              manage everything in one place with real-time updates and powerful insights.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link to="/auth/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth/login">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <Features />
      
      {/* How it Works Section */}
      <WorkflowSteps />
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* Final CTA Section */}
      <CtaSection />
    </div>
  );
};

export default Index;
