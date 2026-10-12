"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  XCircle,
  Radio,
  MessageSquare,
  Send,
  Trash2,
  RefreshCw,
  Eye,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface EventLog {
  id: string;
  timestamp: string;
  type: "incoming" | "outgoing" | "system";
  event: string;
  payload: any;
}

export default function RealtimeChatTestHarness() {
  const { user } = useAuthStore();
  const currentUserId = user?._id;
  const isDev = process.env.NODE_ENV === "development";

  const {
    conversations,
    activeConversationId,
    messages,
    typingState,
    fetchConversations,
    selectConversation,
    sendMessage,
    markRead,
  } = useChatStore();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [testMessageText, setTestMessageText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const addLog = (
    type: "incoming" | "outgoing" | "system",
    event: string,
    payload: any
  ) => {
    const newEntry: EventLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      event,
      payload,
    };
    setEventLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    fetchConversations();
    const socket = connectSocket();

    if (socket) {
      setIsConnected(socket.connected);
      setSocketId(socket.id || null);

      const onConnect = () => {
        setIsConnected(true);
        setSocketId(socket.id || null);
        addLog("system", "connect", { socketId: socket.id });
      };

      const onDisconnect = (reason: string) => {
        setIsConnected(false);
        setSocketId(null);
        addLog("system", "disconnect", { reason });
      };

      const onNewMessage = (msg: any) => {
        addLog("incoming", "new_message", msg);
      };

      const onMessageRead = (data: any) => {
        addLog("incoming", "message_read", data);
      };

      const onDeliveryUpdated = (data: any) => {
        addLog("incoming", "message_delivery_updated", data);
      };

      const onTypingStart = (data: any) => {
        addLog("incoming", "user_typing_start", data);
      };

      const onTypingStop = (data: any) => {
        addLog("incoming", "user_typing_stop", data);
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("new_message", onNewMessage);
      socket.on("message_read", onMessageRead);
      socket.on("message_delivery_updated", onDeliveryUpdated);
      socket.on("user_typing_start", onTypingStart);
      socket.on("user_typing_stop", onTypingStop);

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("new_message", onNewMessage);
        socket.off("message_read", onMessageRead);
        socket.off("message_delivery_updated", onDeliveryUpdated);
        socket.off("user_typing_start", onTypingStart);
        socket.off("user_typing_stop", onTypingStop);
      };
    }
  }, []);

  const handleToggleConnection = () => {
    const socket = getSocket();
    if (socket && socket.connected) {
      disconnectSocket();
      setIsConnected(false);
      setSocketId(null);
      addLog("system", "manual_disconnect", {});
    } else {
      const s = connectSocket();
      setIsConnected(s.connected);
      setSocketId(s.id || null);
      addLog("system", "manual_connect", {});
    }
  };

  const handleSendTestMessage = async () => {
    if (!testMessageText.trim() || !activeConversationId) return;
    const text = testMessageText.trim();
    setTestMessageText("");

    addLog("outgoing", "send_message_api", { conversationId: activeConversationId, text });

    try {
      await sendMessage(activeConversationId, text);
    } catch (err: any) {
      addLog("system", "send_message_error", { error: err.message });
    }
  };

  const handleEmitTypingStart = () => {
    const socket = getSocket();
    if (socket && activeConversationId) {
      socket.emit("typing_start", { conversationId: activeConversationId });
      setIsTyping(true);
      addLog("outgoing", "typing_start", { conversationId: activeConversationId });
    }
  };

  const handleEmitTypingStop = () => {
    const socket = getSocket();
    if (socket && activeConversationId) {
      socket.emit("typing_stop", { conversationId: activeConversationId });
      setIsTyping(false);
      addLog("outgoing", "typing_stop", { conversationId: activeConversationId });
    }
  };

  const handleMarkRead = async () => {
    if (!activeConversationId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("mark_message_read", { conversationId: activeConversationId });
      addLog("outgoing", "mark_message_read_socket", { conversationId: activeConversationId });
    }
    await markRead(activeConversationId);
  };

  if (!isDev) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-gray-200 text-center space-y-4">
          <Shield className="w-12 h-12 text-blue-600 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Development Test Harness</h2>
          <p className="text-sm text-gray-600">
            This test harness is restricted to development mode (`NODE_ENV === &apos;development&apos;`).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50 text-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#0066FF]" />
              <h1 className="text-2xl font-bold text-gray-900">Real-Time Chat Test Harness</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-[#0066FF] rounded-full">
                DEV ONLY
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live Socket.IO connection monitor, room event inspector, and diagnostic toolbar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleConnection}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              }`}
            >
              <Radio className={`w-4 h-4 ${isConnected ? "animate-pulse" : ""}`} />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </button>

            <button
              onClick={() => fetchConversations()}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors"
              title="Refresh conversations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Socket Connection</span>
            <div className="flex items-center gap-2 mt-1">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-semibold text-gray-900">
                {isConnected ? "Active" : "Disconnected"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-1">ID: {socketId || "N/A"}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Authenticated User</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {user?.email || "Guest"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-1">UID: {currentUserId || "N/A"}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Active Room</span>
            <div className="flex items-center gap-2 mt-1">
              <MessageSquare className="w-4 h-4 text-[#0066FF]" />
              <span className="text-sm font-semibold text-gray-900 truncate">
                {activeConversationId ? `conversation:${activeConversationId}` : "None Selected"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-1">
              Loaded Messages: {messages.length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-xs text-gray-500 font-medium">Typing State</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-sm font-semibold ${
                  activeConversationId && typingState[activeConversationId]
                    ? "text-emerald-600 animate-pulse"
                    : "text-gray-500"
                }`}
              >
                {activeConversationId && typingState[activeConversationId]
                  ? "Participant Typing..."
                  : "Idle"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-1">
              Local Typing: {isTyping ? "Active" : "Stopped"}
            </p>
          </div>
        </div>

        {/* Main Grid: Control Panel + Event Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Column */}
          <div className="space-y-6">
            
            {/* Conversation Selector */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0066FF]" />
                <span>Select Conversation</span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {conversations.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No conversations available.</p>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = activeConversationId === conv._id;
                    return (
                      <button
                        key={conv._id}
                        onClick={() => selectConversation(conv._id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-[#0066FF] border border-blue-200 font-semibold"
                            : "hover:bg-gray-50 text-gray-700 border border-transparent"
                        }`}
                      >
                        <span className="truncate max-w-[200px]">
                          {conv.otherParticipant?.firstName || conv._id}
                        </span>
                        {conv.unreadCount ? (
                          <span className="px-2 py-0.5 bg-[#0066FF] text-white rounded-full text-[10px]">
                            {conv.unreadCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#0066FF]" />
                <span>Event Triggers</span>
              </h3>

              <div className="space-y-3">
                {/* Send Test Message */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 font-medium">Send Test Message</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testMessageText}
                      onChange={(e) => setTestMessageText(e.target.value)}
                      placeholder="Type test message..."
                      className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0066FF]"
                    />
                    <button
                      onClick={handleSendTestMessage}
                      disabled={!testMessageText.trim() || !activeConversationId}
                      className="px-3 py-2 bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Typing Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleEmitTypingStart}
                    disabled={!activeConversationId}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 rounded-xl text-xs font-medium border border-emerald-200 transition-all cursor-pointer"
                  >
                    Emit typing_start
                  </button>
                  <button
                    onClick={handleEmitTypingStop}
                    disabled={!activeConversationId}
                    className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 rounded-xl text-xs font-medium border border-gray-200 transition-all cursor-pointer"
                  >
                    Emit typing_stop
                  </button>
                </div>

                {/* Mark Read */}
                <button
                  onClick={handleMarkRead}
                  disabled={!activeConversationId}
                  className="w-full px-3 py-2 bg-blue-50 text-[#0066FF] hover:bg-blue-100 disabled:opacity-50 rounded-xl text-xs font-medium border border-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mark Conversation Read</span>
                </button>
              </div>
            </div>
          </div>

          {/* Event Stream Log */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-semibold text-gray-900">Real-Time Socket Event Stream</h3>
                <span className="text-xs text-gray-400 font-normal">({eventLogs.length} events)</span>
              </div>
              <button
                onClick={() => setEventLogs([])}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 max-h-[550px] scrollbar-thin">
              {eventLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-gray-400 py-16">
                  <p className="text-xs">No socket events captured yet. Select a room or send a message.</p>
                </div>
              ) : (
                eventLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                      log.type === "incoming"
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : log.type === "outgoing"
                        ? "bg-blue-50/70 border-blue-200 text-blue-950"
                        : "bg-gray-50 border-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.type === "incoming"
                              ? "bg-emerald-500"
                              : log.type === "outgoing"
                              ? "bg-[#0066FF]"
                              : "bg-gray-400"
                          }`}
                        />
                        [{log.type.toUpperCase()}] {log.event}
                      </span>
                      <span className="text-[10px] opacity-60 font-sans">{log.timestamp}</span>
                    </div>

                    <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap opacity-90 font-mono bg-white/60 p-2 rounded-lg border border-black/5">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
