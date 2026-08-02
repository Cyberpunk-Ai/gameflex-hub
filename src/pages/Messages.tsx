// @ts-nocheck
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { ConversationList } from "@/components/messaging/conversation-list";
import { ChatWindow } from "@/components/messaging/chat-window";
import { NewConversationModal } from "@/components/messaging/new-conversation-modal";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showListPanel, setShowListPanel] = useState(true);

  const handleSelectConversation = (conversationId: string, otherUser: any) => {
    setSelectedConversationId(conversationId);
    setSelectedUser(otherUser);
    setShowMobileChat(true);
  };

  const handleNewConversation = (conversationId: string, otherUser: any) => {
    setSelectedConversationId(conversationId);
    setSelectedUser(otherUser);
    setShowMobileChat(true);
    setShowNewConversation(false);
  };

  const handleBack = () => {
    setShowMobileChat(false);
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-8 shadow-sm">
          <div
            className="h-16 w-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-primary-foreground shadow-md"
            style={{
              background: "linear-gradient(135deg, hsl(142 76% 45%) 0%, hsl(160 80% 42%) 100%)",
            }}
          >
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Sign in to message</h2>
          <p className="text-muted-foreground text-sm mb-5">
            Chat with your squad and other GameFlex players securely.
          </p>
          <Button asChild className="w-full h-11 rounded-xl font-semibold">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh)] overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Left panel — conversation list */}
      <div
        className={cn(
          "w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-border/50 bg-card/40 backdrop-blur-md flex flex-col",
          "transition-transform duration-300 ease-in-out md:transition-none",
          // Mobile: slide out when chat is open
          showMobileChat &&
            "md:translate-x-0 -translate-x-full md:flex absolute md:relative inset-y-0 left-0 z-10",
          !showMobileChat && "translate-x-0 flex",
        )}
      >
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onCompose={() => setShowNewConversation(true)}
        />
      </div>

      {/* Right panel — chat window */}
      <div
        className={cn(
          "flex-1 bg-background flex flex-col min-w-0",
          "transition-transform duration-300 ease-in-out md:transition-none",
          // Mobile: slide in when chat is selected
          !showMobileChat &&
            "md:translate-x-0 translate-x-full md:flex absolute md:relative inset-y-0 right-0",
          showMobileChat && "translate-x-0 flex",
        )}
      >
        {selectedConversationId && selectedUser ? (
          <ChatWindow
            conversationId={selectedConversationId}
            otherUser={selectedUser}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div
              className="relative h-24 w-24 rounded-3xl mb-6 flex items-center justify-center text-primary-foreground shadow-lg"
              style={{
                background: "linear-gradient(135deg, hsl(142 76% 45%) 0%, hsl(160 80% 42%) 100%)",
              }}
            >
              <MessageCircle className="h-11 w-11" />
              <span className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 pointer-events-none" />
            </div>
            <p className="font-display text-2xl font-bold mb-2 tracking-tight">Your Messages</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              Send private messages and clips to friends and teammates on GameFlex.
            </p>
            <Button
              onClick={() => setShowNewConversation(true)}
              className="gap-2 h-11 px-6 rounded-xl font-semibold shadow-md"
            >
              <MessageCircle className="h-4 w-4" />
              Start a conversation
            </Button>
          </div>
        )}
      </div>

      <NewConversationModal
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onConversationCreated={handleNewConversation}
      />
    </div>
  );
}
