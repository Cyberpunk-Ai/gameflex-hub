// @ts-nocheck
import { Link } from "@/lib/router-compat";
import {
  UserPlus,
  Search,
  CreditCard,
  Gamepad2,
  Trophy,
  Wallet,
  ArrowRight,
  CheckCircle,
  Shield,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Create Your Account",
    description:
      "Sign up with your email and set up your gaming profile. Add your in-game handles for the games you play.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    step: 2,
    icon: Search,
    title: "Find Tournaments",
    description:
      "Browse upcoming tournaments for FIFA, COD, PUBG, and more. Filter by game, entry fee, and prize pool.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    step: 3,
    icon: CreditCard,
    title: "Register & Pay",
    description:
      "Join tournaments by paying the entry fee via M-Pesa. Your registration is confirmed instantly.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    step: 4,
    icon: Gamepad2,
    title: "Compete",
    description:
      "Get matched with opponents, receive room codes, and play your matches. May the best player win!",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    step: 5,
    icon: Trophy,
    title: "Win & Earn",
    description:
      "Top players win cash prizes! Rankings are updated on the leaderboard for bragging rights.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    step: 6,
    icon: Wallet,
    title: "Withdraw Winnings",
    description:
      "Cash out your earnings directly to M-Pesa within 48 hours. Minimum withdrawal is KES 100.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const features = [
  {
    icon: Shield,
    title: "Secure Payments",
    description:
      "All transactions are processed securely through M-Pesa with instant confirmation.",
  },
  {
    icon: Clock,
    title: "Fast Payouts",
    description: "Winners receive their prizes within 48 hours of tournament completion.",
  },
  {
    icon: Trophy,
    title: "Fair Competition",
    description: "Anti-cheat measures and fair play policies ensure a level playing field.",
  },
  {
    icon: Gamepad2,
    title: "Multiple Games",
    description: "Compete in FIFA, COD, PUBG, Fortnite, Apex Legends, and more.",
  },
];

const games = ["FIFA", "Call of Duty", "PUBG", "Fortnite", "Apex Legends", "Valorant"];

export default function HowItWorks() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge className="mb-4">How It Works</Badge>
        <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">
          Start Winning in <span className="text-primary">6 Simple Steps</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          GameFlex makes it easy to join competitive gaming tournaments, compete with the best, and
          earn real money. Here's how to get started.
        </p>
      </div>

      {/* Steps */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
        {steps.map((item) => (
          <Card
            key={item.step}
            className="border-border/50 bg-card/80 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-6">
              <div
                className={`absolute top-4 right-4 text-6xl font-bold opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}
              >
                {item.step}
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-4`}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-xl font-semibold font-display mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features */}
      <div className="bg-card/50 rounded-3xl p-8 md:p-12 mb-16">
        <h2 className="text-2xl font-bold font-display text-center mb-8">Why Choose GameFlex?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Games */}
      <div className="text-center mb-16">
        <h2 className="text-2xl font-bold font-display mb-6">Supported Games</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {games.map((game) => (
            <Badge key={game} variant="outline" className="text-base py-2 px-4">
              {game}
            </Badge>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="max-w-3xl mx-auto mb-16">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold font-display mb-6 text-center">What You Need</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Gaming Device</p>
                  <p className="text-sm text-muted-foreground">PlayStation, Xbox, PC, or Mobile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Stable Internet</p>
                  <p className="text-sm text-muted-foreground">For smooth online gameplay</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">M-Pesa Account</p>
                  <p className="text-sm text-muted-foreground">For payments and withdrawals</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Game Account</p>
                  <p className="text-sm text-muted-foreground">
                    Active account for your chosen game
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-3xl font-bold font-display mb-4">Ready to Compete?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of gamers already winning on GameFlex. Sign up today and enter your first
          tournament!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/auth">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/tournaments">Browse Tournaments</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
