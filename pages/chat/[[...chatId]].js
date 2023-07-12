import { useState } from "react";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";

import { ChatSidebar, Message } from "components";

export default function ChatPage() {
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsGeneratingResponse(true);
    setNewChatMessages((prevM) => {
      const newChatMessages = [
        ...prevM,
        {
          _id: uuid(),
          role: "user",
          content: messageText,
        },
      ];
      setMessageText("");

      return newChatMessages;
    });

    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });

    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    await streamReader(reader, (message) => {
      setIncomingMessage((prevMessage) => `${prevMessage}${message.content}`);
    });

    setIsGeneratingResponse(false);
  };

  return (
    <div>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar />
        <div className="flex flex-col bg-gray-700">
          <div className="flex-1 text-white">
            {newChatMessages.map((message) => (
              <Message
                key={message._id}
                role={message.role}
                content={message.content}
              />
            ))}
            {incomingMessage && (
              <Message role="assistant" content={incomingMessage} />
            )}
          </div>

          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset disabled={isGeneratingResponse} className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                  placeholder={isGeneratingResponse ? "" : "Send a message..."}
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
}
