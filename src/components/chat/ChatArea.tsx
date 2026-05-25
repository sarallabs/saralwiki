"use client";

import { useState, useEffect, useRef } from "react";
import * as Ably from "ably";
import { Message, Channel } from "@/lib/types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ThreadPanel } from "./ThreadPanel";
import { Hash } from "lucide-react";

let sharedAblyClient: Ably.Realtime | null = null;

interface ChatAreaProps {
  channel: Channel;
  currentUserId: string;
}

interface ReactionEvent {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  userName?: string | null;
  action: "added" | "removed";
}

export function ChatArea({ channel, currentUserId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      const res = await fetch(`/api/channels/${channel.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
      setLoading(false);
      scrollToBottom();
    }
    fetchMessages();
  }, [channel.id]);

  useEffect(() => {
    let ablyChannel: ReturnType<Ably.Realtime["channels"]["get"]> | null = null;

    async function initAbly() {
      if (!sharedAblyClient) {
        sharedAblyClient = new Ably.Realtime({ authUrl: "/api/ably/auth" });
      }
      ablyChannel = sharedAblyClient.channels.get(`channel:${channel.id}`);
      
      ablyChannel.subscribe("message", (message: Ably.Message) => {
        setMessages(prev => {
          const newMsg = message.data as Message;
          if (prev.find(m => m.id === newMsg.id)) return prev;
          
          let updated = [...prev, newMsg];
          if (newMsg.threadParentId) {
            updated = updated.map(m => m.id === newMsg.threadParentId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m);
          }
          return updated;
        });
        scrollToBottom();
      });

      ablyChannel.subscribe("reaction", (message: Ably.Message) => {
        setMessages(prev => prev.map(msg => {
          const rx = message.data as ReactionEvent;
          if (msg.id !== rx.messageId) return msg;
          let newReactions = [...(msg.reactions || [])];
          if (rx.action === "added") {
            newReactions.push({ id: rx.id, messageId: rx.messageId, userId: rx.userId, emoji: rx.emoji, userName: rx.userName });
          } else {
            newReactions = newReactions.filter(r => r.id !== rx.id);
          }
          return { ...msg, reactions: newReactions };
        }));
      });
    }

    initAbly();

    return () => {
      try {
        if (ablyChannel) {
          ablyChannel.unsubscribe();
          void ablyChannel.detach();
        }
      } catch {
        // Ignore synchronous cleanup errors
      }
    };
  }, [channel.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (content: string, threadParentId?: string) => {
    await fetch(`/api/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, threadParentId })
    });
  };

  const handleReact = async (messageId: string, emoji: string) => {
    await fetch(`/api/channels/${channel.id}/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji })
    });
  };

  const mainMessages = messages.filter(m => !m.threadParentId);
  const activeParent = messages.find(m => m.id === activeThreadId) || null;
  const threadReplies = messages.filter(m => m.threadParentId === activeThreadId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--background))]">
        <div className="px-5 py-3.5 border-b border-[hsl(var(--border))] flex items-center gap-2 bg-[hsl(var(--background))]/80 backdrop-blur-sm shrink-0">
          <Hash className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <h2 className="font-semibold">{channel.name}</h2>
          {channel.description && (
            <>
              <div className="w-px h-4 bg-[hsl(var(--border))] mx-2" />
              <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">{channel.description}</span>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-[hsl(var(--muted-foreground))] animate-pulse">Loading messages...</span>
            </div>
          ) : (
            <>
              <MessageList
                messages={mainMessages}
                currentUserId={currentUserId}
                onReply={(msg) => setActiveThreadId(msg.id)}
                onReact={handleReact}
              />
              <div ref={scrollRef} />
            </>
          )}
        </div>

        <MessageInput onSendMessage={(content) => handleSendMessage(content)} placeholder={`Message #${channel.name}`} />
      </div>

      {/* Thread Panel */}
      {activeThreadId && activeParent && (
        <ThreadPanel
          parentMessage={activeParent}
          replies={threadReplies}
          currentUserId={currentUserId}
          onClose={() => setActiveThreadId(null)}
          onSendReply={(content) => handleSendMessage(content, activeThreadId)}
          onReact={handleReact}
        />
      )}
    </div>
  );
}
