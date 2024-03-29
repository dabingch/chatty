import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "@auth0/nextjs-auth0";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";
import { ChatSidebar, Message } from "components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function ChatPage({ chatId, messages = [], title }) {
  // State for new chatId after generating a new chat
  const [newChatId, setNewChatId] = useState(null);
  // State for checking if the route has changed
  const [originalChatId, setOriginalChatId] = useState(chatId);
  // State for the input message from user
  const [messageText, setMessageText] = useState("");
  // State for incoming streaming message
  // Used to show the stream message output from the robot
  const [incomingMessage, setIncomingMessage] = useState("");
  // State for full content of the one-time streaming message from robot
  const [fullMessage, setFullMessage] = useState("");
  // State for the new chat message from user
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const router = useRouter();

  const hasChangedRoute = originalChatId !== chatId;

  // When route changes, clear the new chat
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  // Save the newly streamed message to the messages after the full response is generated
  useEffect(() => {
    if (!hasChangedRoute && !isGeneratingResponse && fullMessage) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: fullMessage,
        },
      ]);
      setFullMessage("");
    }
  }, [isGeneratingResponse, fullMessage, hasChangedRoute]);

  // If create a new chat, redirect to that chat page
  useEffect(() => {
    if (!isGeneratingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, isGeneratingResponse, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setOriginalChatId(chatId);
    setIsGeneratingResponse(true);
    // User send a message to the robot
    setNewChatMessages((prevM) => {
      const newChatMessages = [
        ...prevM,
        {
          _id: uuid(),
          role: "user",
          content: messageText,
        },
      ];

      return newChatMessages;
    });

    setMessageText("");

    // Robot response to the user
    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ chatId, message: messageText }),
    });

    const data = response.body;
    if (!data) {
      res.status(500).json({ message: "Error sending message to client" });
      return;
    }

    // Read the stream response from the robot
    const reader = data.getReader();
    // concatenate the streamed response
    let content = "";
    await streamReader(reader, (message) => {
      if (message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        setIncomingMessage((prevMessage) => `${prevMessage}${message.content}`);
        content = content + message.content;
      }
    });

    setFullMessage(content);
    setIncomingMessage("");
    setIsGeneratingResponse(false);
  };

  // All chat messages from the user and robot
  const allMessages = [...messages, ...newChatMessages];

  return (
    <div>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar
          chatId={chatId}
          isGeneratingResponse={isGeneratingResponse}
        />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex flex-1 flex-col-reverse overflow-scroll text-white">
            {!allMessages.length && !incomingMessage && (
              <div className="m-auto flex flex-col items-center justify-center gap-2 text-center">
                <FontAwesomeIcon
                  icon={faRobot}
                  className="text-6xl text-emerald-200"
                />
                <h1 className="font-body text-4xl text-white/50">
                  Ask me a question!
                </h1>
              </div>
            )}
            {allMessages.length > 0 && (
              <div className="mb-auto">
                {allMessages.map((message) => (
                  <Message
                    key={message._id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {incomingMessage && !hasChangedRoute && (
                  <Message role="assistant" content={incomingMessage} />
                )}
                {incomingMessage && hasChangedRoute && (
                  <Message
                    role="notice"
                    content="Only one message is allowed at one time, Please allow other response to complete before sending another message. This will be disappeared after the response completes."
                  />
                )}
              </div>
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

export const getServerSideProps = async (context) => {
  // Find the chatId from the URL or null in new chat
  const chatId = context.params?.chatId?.[0] || null;

  // Get all messages from the current chatId
  if (chatId) {
    try {
      const { user } = await getSession(context.req, context.res);
      const client = await clientPromise;
      const db = await client.db("chatty");
      const chat = await db.collection("chats").findOne({
        userId: user.sub,
        _id: new ObjectId(chatId),
      });

      return {
        props: {
          chatId,
          title: chat.title,
          messages: chat.messages.map((message) => ({
            ...message,
            _id: uuid(),
          })),
        },
      };
    } catch (error) {
      return {
        notFound: true,
      };
    }
  }

  return {
    props: {},
  };
};
