// components/ChatWindow.tsx
import React, { useEffect, useRef } from "react";

type Message = {
  role: "user" | "bot" | "scenario";
  text: string;
};

type ChatWindowProps = {
  messages: Message[];
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div className="min-h-[400px] overflow-y-scroll border p-2 mb-4 text-text rounded">
      {messages.map((msg, idx) => (
        <div key={idx} className="mb-1">
          <span className="font-semibold capitalize">{msg.role}:</span>{" "}
          {msg.text}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
