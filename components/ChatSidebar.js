import { useEffect, useState } from "react";
import Link from "next/link";

const ChatSidebar = () => {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    const loadChatList = async () => {
      const response = await fetch("/api/chat/getChatList", {
        method: "GET",
      });

      const data = await response.json();
      console.log("GET CHAT LIST", data);

      setChatList(data?.chats || []);
    };

    loadChatList();
  }, []);

  return (
    <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
      <Link className="side-menu-item" href="/chat">
        New Chat
      </Link>
      <div className="flex-1 overflow-auto bg-gray-950">
        {chatList.map((chat) => (
          <Link
            className="side-menu-item"
            key={chat._id}
            href={`/chat/${chat._id}`}
          >
            {chat.title}
          </Link>
        ))}
      </div>
      <Link className="side-menu-item" href="/api/auth/logout">
        Logout
      </Link>
    </div>
  );
};

export default ChatSidebar;
