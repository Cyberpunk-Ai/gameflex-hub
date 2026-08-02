// @ts-nocheck
import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Get a response within 24 hours",
    value: "support@gameflex.co.ke",
    href: "mailto:support@gameflex.co.ke",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon-Fri, 9am-6pm EAT",
    value: "+254 704 208 394",
    href: "tel:+254704208394",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Quick responses",
    value: "+254 704 208 394",
    href: "https://wa.me/254704208394",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Our office location",
    value: "Nairobi, Kenya",
    href: null,
  },
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();
  const hasRequiredFields =
    formData.name.trim() && formData.email.trim() && formData.subject && formData.message.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-display mb-4">Contact Us</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have questions or need help? We're here for you. Reach out through any channel below.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {contactMethods.map((method) => (
            <Card
              key={method.title}
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-6">
                {method.href ? (
                  <a
                    href={method.href}
                    target={method.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    <method.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-sm text-primary hover:underline">{method.value}</p>
                  </a>
                ) : (
                  <>
                    <method.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-sm">{method.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form and we'll respond as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(v) => setFormData({ ...formData, subject: v })}
                  >
                    <SelectTrigger aria-label="Select a support topic">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="tournament">Tournament Question</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  We usually reply within one business day, and urgent issues can also be sent
                  through WhatsApp.
                </p>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !hasRequiredFields}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Teaser */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">How do I join a tournament?</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse tournaments, click "Register", pay the entry fee via M-Pesa, and you're
                    in!
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">When will I receive my prize?</h4>
                  <p className="text-sm text-muted-foreground">
                    Prizes are distributed within 48 hours of tournament completion via M-Pesa.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Can I get a refund?</h4>
                  <p className="text-sm text-muted-foreground">
                    Refunds are available before registration closes. See our Refund Policy for
                    details.
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/faqs">View All FAQs</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">🎮 Join Our Community</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with other gamers, get tournament updates, and chat with our team on
                  WhatsApp!
                </p>
                <Button asChild className="w-full">
                  <a
                    href="https://chat.whatsapp.com/gameflex"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Join WhatsApp Group
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
