// @ts-nocheck
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Search,
  CreditCard,
  Trophy,
  Gamepad2,
  Shield,
  MessageSquare,
} from "lucide-react";

const faqCategories = [
  {
    id: "payments",
    title: "Payments & M-Pesa",
    icon: <CreditCard className="w-5 h-5" />,
    faqs: [
      {
        question: "How do I pay for tournament entry?",
        answer:
          'To pay for a tournament, click "Register" on the tournament page. You\'ll be prompted to pay via M-Pesa Send Money to 0704208394. Send the exact amount, then enter your M-Pesa transaction code. Our team will verify your payment within 24 hours.',
      },
      {
        question: "How long does payment verification take?",
        answer:
          "Payment verification typically takes 1-24 hours. We verify M-Pesa transaction codes to ensure accuracy. You'll receive a notification once your payment is confirmed.",
      },
      {
        question: "What happens if my payment is rejected?",
        answer:
          "If your payment is rejected, you'll receive a notification explaining why. Common reasons include incorrect amount, duplicate transaction codes, or unclear screenshots. You can resubmit your payment with the correct information.",
      },
      {
        question: "How do I withdraw my winnings?",
        answer:
          "Winnings are sent directly to your registered M-Pesa number after tournament completion and result verification. Ensure your phone number in your profile is correct. Withdrawals are processed within 48 hours.",
      },
    ],
  },
  {
    id: "tournaments",
    title: "Tournaments",
    icon: <Trophy className="w-5 h-5" />,
    faqs: [
      {
        question: "How do I join a tournament?",
        answer:
          'Browse available tournaments on the Tournaments page. Click "Register" on your chosen tournament, complete the payment, and wait for confirmation. You\'ll receive game room details before the tournament starts.',
      },
      {
        question: "What tournament formats are available?",
        answer:
          "We offer Single Elimination (one loss and you're out), Double Elimination (two losses to eliminate), Round Robin (play everyone), and Swiss Format (paired by performance). Each tournament specifies its format.",
      },
      {
        question: "Can I cancel my registration?",
        answer:
          "You can cancel your registration up to 24 hours before the tournament starts for a full refund. Cancellations within 24 hours may be subject to a processing fee or no refund depending on circumstances.",
      },
      {
        question: "What happens if I miss my match?",
        answer:
          "If you don't show up for your scheduled match within 10 minutes, you may be disqualified. Contact support immediately if you have connectivity issues or emergencies.",
      },
    ],
  },
  {
    id: "gameplay",
    title: "Gameplay & Rules",
    icon: <Gamepad2 className="w-5 h-5" />,
    faqs: [
      {
        question: "What games are supported?",
        answer:
          "We currently support FIFA, Call of Duty, PUBG, Fortnite, Apex Legends, and Valorant. New games are added regularly based on community demand.",
      },
      {
        question: "How do I get game room codes?",
        answer:
          "Game room codes are shared via the Game Rooms page and WhatsApp before your match. Log in to see your assigned rooms and credentials.",
      },
      {
        question: "How are winners determined?",
        answer:
          "Winners are determined by in-game scores. Both players must submit their results. In case of disputes, screenshots or recorded gameplay may be required for verification.",
      },
      {
        question: "What if there's a dispute about match results?",
        answer:
          "If there's a dispute, both players can submit evidence (screenshots, recordings). Our moderators will review and make a final decision within 24 hours. False claims may result in account penalties.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Security",
    icon: <Shield className="w-5 h-5" />,
    faqs: [
      {
        question: "How do I verify my account?",
        answer:
          "Account verification requires a valid phone number and at least one verified payment. Verified accounts get priority support and access to exclusive tournaments.",
      },
      {
        question: "Can I change my username?",
        answer:
          "You can change your username once every 30 days through your Profile settings. Your game handle can be updated anytime.",
      },
      {
        question: "What if I forget my password?",
        answer:
          "Click \"Forgot Password\" on the login page and enter your email. You'll receive a reset link. If you don't receive it, check your spam folder or contact support.",
      },
      {
        question: "How do I report suspicious activity?",
        answer:
          "If you notice suspicious activity on your account or during matches, immediately contact support through the Support page or WhatsApp. Include as much detail as possible.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: <MessageSquare className="w-5 h-5" />,
    faqs: [
      {
        question: "How do I contact support?",
        answer:
          "You can reach support through the Support page by creating a ticket, or via WhatsApp for urgent issues. We respond to all tickets within 24 hours.",
      },
      {
        question: "What are support hours?",
        answer:
          "Our support team is available 24/7 for urgent issues. General inquiries are answered during business hours (8 AM - 10 PM EAT).",
      },
      {
        question: "Can I request a refund?",
        answer:
          "Refunds are available for cancelled tournaments or verified payment errors. Submit a support ticket with your transaction details for review.",
      },
    ],
  },
];

const FAQs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => !selectedCategory || category.id === selectedCategory)
    .filter((category) => category.faqs.length > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/20 border border-primary/30">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about tournaments, payments, and more
          </p>
        </div>

        {/* Search */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                aria-label="Search frequently asked questions"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6" role="list" aria-label="FAQ categories">
          <button
            type="button"
            aria-pressed={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${selectedCategory === null ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background/70 text-foreground hover:border-primary/50"}`}
          >
            All
          </button>
          {faqCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${selectedCategory === category.id ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background/70 text-foreground hover:border-primary/50"}`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <Card key={category.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No FAQs found matching your search. Try different keywords or{" "}
                  <a href="/support" className="text-primary hover:underline">
                    contact support
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Support CTA */}
        <Card className="border-primary/30 bg-primary/5 mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">Our support team is here to help you 24/7</p>
            <a href="/support">
              <Badge className="cursor-pointer">Contact Support</Badge>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQs;
