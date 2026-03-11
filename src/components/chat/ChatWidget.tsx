import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at: string;
}

interface ChatWidgetProps {
  businessId: string;
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  title?: string;
  subtitle?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;

export function ChatWidget({
  businessId,
  position = "bottom-right",
  primaryColor,
  title = "Support Chat",
  subtitle = "Ask us anything",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [emailCollected, setEmailCollected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId.current,
          business_id: businessId,
          history: messages.slice(-10),
          sender_email: senderEmail || undefined,
          sender_name: senderName || undefined,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const assistantId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m) =>
                    m.id === assistantId ? { ...m, message: assistantContent } : m
                  );
                }
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: "assistant",
                    message: assistantContent,
                    created_at: new Date().toISOString(),
                  },
                ];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          message: "Sorry, I'm having trouble connecting right now. Please try again or contact support directly.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, businessId, messages, senderEmail, senderName]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senderEmail.trim()) {
      setEmailCollected(true);
    }
  };

  const positionClasses = position === "bottom-right" ? "right-4 sm:right-6" : "left-4 sm:left-6";

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-4 sm:bottom-6 z-50 rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-110",
            "bg-primary text-primary-foreground",
            positionClasses
          )}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className={cn(
            "fixed bottom-4 sm:bottom-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[32rem] flex flex-col rounded-2xl border shadow-2xl overflow-hidden",
            "bg-background",
            positionClasses
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs opacity-80">{subtitle}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20">
                <Minimize2 className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Email collection */}
          {!emailCollected ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <form onSubmit={handleEmailSubmit} className="w-full space-y-4 text-center">
                <Bot className="h-10 w-10 mx-auto text-primary" />
                <p className="font-medium text-foreground">Welcome! 👋</p>
                <p className="text-sm text-muted-foreground">
                  Enter your details to start chatting with our AI assistant.
                </p>
                <Input
                  placeholder="Your name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  Start Chat
                </Button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setEmailCollected(true)}
                >
                  Skip – chat anonymously
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm mt-8 space-y-2">
                    <Bot className="h-8 w-8 mx-auto text-primary/60" />
                    <p>Hi{senderName ? ` ${senderName}` : ""}! How can I help you today?</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {["Check ticket status", "I have a question", "Contact support"].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setInput(q);
                          }}
                          className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2 items-start",
                        msg.role === "user" ? "flex-row-reverse" : ""
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {msg.role === "user" ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="bg-muted rounded-xl px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
