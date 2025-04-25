
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mail } from "lucide-react";

export function ContactForm({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For now, just log the form data
      console.log("Form submitted:", formData);
      toast.success("Message sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
          />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            required
            value={formData.company}
            onChange={handleChange}
            placeholder="Your company name"
          />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            required
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your needs..."
            className="min-h-[100px]"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        <mail className="mr-2 h-4 w-4" />
        {isLoading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
