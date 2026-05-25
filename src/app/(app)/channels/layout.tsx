"use client";

import { useState, useEffect } from "react";
import { Plus, Hash, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Channel } from "@/lib/types";
import { AccessSummary } from "@/components/access/AccessSummary";

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const params = useParams();
  const activeChannelId = params.channelId as string;

  const fetchChannels = async () => {
    const res = await fetch("/api/channels");
    if (res.ok) {
      const data = await res.json();
      setChannels(data.channels ?? []);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchChannels();
    });
  }, []);

  const handleCreateChannel = async () => {
    const name = newChannelName.trim();
    if (!name) return;
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setNewChannelName("");
    setShowCreate(false);
    fetchChannels();
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/20 flex flex-col shrink-0">
        <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span>Chat</span>
          </div>
          <button onClick={() => setShowCreate(true)} className="p-1 rounded hover:bg-[hsl(var(--secondary))] transition-colors" title="New Channel">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 px-2">Channels</div>
          {channels.map(channel => (
            <Link
              key={channel.id}
              href={`/channels/${channel.id}`}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${activeChannelId === channel.id ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"}`}
            >
              <Hash className="w-4 h-4 opacity-50" />
              <span className="truncate">{channel.name}</span>
            </Link>
          ))}
          {channels.length === 0 && (
            <div className="px-2 py-2 text-xs text-[hsl(var(--muted-foreground))]">No channels yet</div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[hsl(var(--background))]">
        {children}
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Create Channel</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Add @email or @name in the channel name to grant that user access.</p>
            </div>
            <input
              autoFocus
              className="input-field"
              placeholder="channel-name or @sriram project-discussion"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateChannel();
                if (e.key === "Escape") setShowCreate(false);
              }}
            />
            <AccessSummary
              allowedRoles={["admin"]}
              allowedUsers={[]}
              mentionText={newChannelName}
              note="Admins can edit every channel. Mentioned users are added as specific users automatically."
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button type="button" onClick={handleCreateChannel} className="btn-primary flex-1 justify-center">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
