"use client";

import { ChatConversationItem, ChatMessageItem, ChatParticipant } from "@/lib/api";
import { Avatar, Card, Chip } from "@/components/ui";
import { ChevronLeft, Flag, MessageCircle, RefreshCw } from "lucide-react";

const formatTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateLabel = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const getParticipantName = (p?: ChatParticipant | null) => {
  if (!p) return "Unknown User";
  const name = `${p.firstName || ""}`.trim() ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "";
  return name || p.email || p.mobile || "User";
};

const getParticipantAvatar = (p?: ChatParticipant | null) => {
  if (p && p.image) return p.image;
  return undefined;
};

export interface ChatMessageViewerProps {
  selectedConversation: ChatConversationItem | null;
  messages: ChatMessageItem[];
  loading: boolean;
  onClearSelected: () => void;
}

export default function ChatMessageViewer({
  selectedConversation,
  messages,
  loading,
  onClearSelected,
}: ChatMessageViewerProps) {
  // Determine Participant 1 (left) and Participant 2 (right)
  const participant1 = selectedConversation?.participants?.[0] || null;
  const participant2 = selectedConversation?.participants?.[1] || null;

  return (
    <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-[580px]">
      {!selectedConversation ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[var(--ink-3)] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--ember-soft)] border border-[var(--ember-2)] flex items-center justify-center text-[var(--ember)] mb-1 shadow-sm">
            <MessageCircle size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--ink)]">Select a Conversation</h3>
            <p className="text-xs max-w-md text-[var(--ink-3)] leading-relaxed">
              Click on any conversation from the left panel to inspect real-time user messages, shared properties, attachments, and timestamps.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Header */}
          <div className="p-4 bg-[var(--card-2)] border-b border-[var(--hair)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--canvas-2)]"
                onClick={onClearSelected}
              >
                <ChevronLeft size={18} />
              </button>

              {/* Participant 1 Info */}
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={getParticipantName(participant1)}
                  src={getParticipantAvatar(participant1)}
                  size={36}
                  ring
                />
                <div>
                  <div className="text-xs font-bold text-[var(--ink)]">
                    {getParticipantName(participant1)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono">{participant1?.email || "User A"}</div>
                </div>
              </div>

              <div className="px-2 text-[var(--ember)] font-extrabold text-sm">↔</div>

              {/* Participant 2 Info */}
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={getParticipantName(participant2)}
                  src={getParticipantAvatar(participant2)}
                  size={36}
                  ring
                />
                <div>
                  <div className="text-xs font-bold text-[var(--ink)]">
                    {getParticipantName(participant2)}
                  </div>
                  <div className="text-[10px] text-[var(--ink-3)] font-mono">{participant2?.email || "User B"}</div>
                </div>
              </div>
            </div>

            {/* <Chip tone="sand">Read-only Monitor</Chip> */}
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 max-h-[500px] bg-[var(--canvas-2)]">
            {loading ? (
              <div className="py-16 text-center text-[var(--ink-3)] space-y-3">
                <div className="inline-block animate-spin text-[var(--ember)]">
                  <RefreshCw size={24} />
                </div>
                <p className="text-sm font-medium">Fetching message log...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-[var(--ink-3)] font-medium">
                <p className="text-sm">No messages found in this conversation.</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isLeft = participant1 && msg.senderId === participant1._id;
                const sender = isLeft ? participant1 : participant2;
                const showDateSep =
                  index === 0 ||
                  formatDateLabel(messages[index - 1].createdAt) !== formatDateLabel(msg.createdAt);

                return (
                  <div key={msg._id} className="space-y-4">
                    {/* Date Separator */}
                    {showDateSep && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--hair-2)] text-[var(--ink-3)] shadow-xs">
                          {formatDateLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div className={`flex items-end gap-2.5 ${isLeft ? "justify-start" : "justify-end"}`}>
                      {/* Avatar on Left side */}
                      {isLeft && (
                        <Avatar
                          name={getParticipantName(sender)}
                          src={getParticipantAvatar(sender)}
                          size={28}
                        />
                      )}

                      <div className={`max-w-[78%] md:max-w-[68%] rounded-2xl p-3.5 shadow-sm space-y-2 ${isLeft
                        ? "bg-[var(--card)] border border-[var(--hair-2)] text-[var(--ink)] rounded-bl-none"
                        : "bg-[var(--navy)] text-white border border-[var(--navy-2)] rounded-br-none"
                        }`}>
                        {/* Sender Tag */}
                        <div className={`text-[10px] font-bold tracking-wider uppercase ${isLeft ? "text-[var(--ember)]" : "text-[var(--ember-3)]"
                          }`}>
                          {getParticipantName(sender)}
                        </div>

                        {/* Deleted Message */}
                        {msg.isDeleted ? (
                          <p className="text-xs italic opacity-75 flex items-center gap-1.5">
                            <Flag size={12} /> This message was deleted
                          </p>
                        ) : (
                          <>
                            {/* Text Message */}
                            {msg.text && <p className="text-xs leading-relaxed whitespace-pre-wrap font-normal">{msg.text}</p>}

                            {/* Image Message */}
                            {msg.type === "image" && msg.attachment?.url && (
                              <div className="rounded-xl overflow-hidden border border-[var(--hair)] mt-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.attachment.url}
                                  alt={msg.attachment.name || "Attachment"}
                                  className="max-h-60 w-full object-cover"
                                />
                              </div>
                            )}

                            {/* Property Payload Card */}
                            {msg.type === "property" && msg.property && (
                              <div className="mt-2 p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--hair)] flex items-center gap-3 text-[var(--ink)]">
                                {msg.property.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={msg.property.image}
                                    alt={msg.property.title}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-[var(--ink)] truncate">
                                    {msg.property.title}
                                  </div>
                                  {msg.property.rent !== undefined && (
                                    <div className="text-xs font-mono text-[var(--ember)] font-bold mt-0.5">
                                      ₹{msg.property.rent.toLocaleString()}/mo
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Flatmate Post Payload Card */}
                            {msg.type === "flatmate-post" && msg.flatmate && (
                              <div className="mt-2 p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--hair)] flex items-center gap-3 text-[var(--ink)]">
                                {msg.flatmate.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={msg.flatmate.image}
                                    alt={msg.flatmate.title}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-[var(--ink)] truncate">
                                    {msg.flatmate.title}
                                  </div>
                                  {msg.flatmate.budget !== undefined && (
                                    <div className="text-xs font-mono text-[var(--ember)] font-bold mt-0.5">
                                      Budget: ₹{msg.flatmate.budget.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Footer Timestamp & Status */}
                        <div className={`flex items-center justify-end gap-1.5 text-[10px] pt-1 ${isLeft ? "text-[var(--ink-4)]" : "text-slate-300"
                          }`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          <span className="capitalize">({msg.status})</span>
                        </div>
                      </div>

                      {/* Avatar on Right side */}
                      {!isLeft && (
                        <Avatar
                          name={getParticipantName(sender)}
                          src={getParticipantAvatar(sender)}
                          size={28}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </Card>
  );
}
