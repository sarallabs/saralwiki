import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ChatArea } from "@/components/chat/ChatArea";
import { canAccessChannel } from "@/lib/access";
import type { Channel } from "@/lib/types";

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { channelId } = await params;
  
  const { channel } = await canAccessChannel(channelId, session.user.id);
  if (!channel) notFound();

  return <ChatArea channel={channel as unknown as Channel} currentUserId={session.user.id} />;
}
