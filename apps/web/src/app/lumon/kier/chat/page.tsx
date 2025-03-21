import { redirect } from "next/navigation";
import { api } from "@/trpc/server";

export default async function NewChatPage() {
  const newChat = await api.chats.createChat({});
  if (!newChat) {
    throw new Error("Failed to create chat");
  }
  redirect(`/lumon/kier/chat/${newChat.id}`);
}
