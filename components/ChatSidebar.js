import { useEffect, useState } from "react";
import Link from "next/link";

import ChatSidebarItem from "./ChatSidebarItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

const ChatSidebar = ({ chatId }) => {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    const loadChatList = async () => {
      const response = await fetch("/api/chat/getChatList", {
        method: "GET",
      });

      const data = await response.json();

      setChatList(data?.chats || []);
    };

    loadChatList();
  }, [chatId]);

  return (
    <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
      <Link
        className="side-menu-item bg-emerald-500 hover:bg-emerald-600"
        href="/chat"
      >
        <FontAwesomeIcon icon={faPlus} /> New Chat
      </Link>
      <div className="flex-1 overflow-auto bg-gray-950">
        {chatList.map((chat) => (
          <ChatSidebarItem
            key={chat._id}
            chat={chat}
            currentChatId={chatId}
            setChatList={setChatList}
          />
        ))}
      </div>
      <Link className="side-menu-item" href="/api/auth/logout">
        <FontAwesomeIcon icon={faRightFromBracket} />
        Logout
      </Link>
    </div>
  );
};

export default ChatSidebar;
