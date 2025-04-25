
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactForm } from "./ContactForm";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Sales</DialogTitle>
          <DialogDescription>
            Get in touch with our sales team to discuss enterprise solutions for your organization.
          </DialogDescription>
        </DialogHeader>
        <ContactForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
