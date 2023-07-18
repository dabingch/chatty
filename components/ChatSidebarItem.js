import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faMessage,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const ChatSidebarItem = ({
  chat,
  currentChatId: chatId,
  setChatList,
  isGeneratingResponse,
}) => {
  const router = useRouter();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteChat = async (chatId) => {
    await fetch("/api/chat/deleteChat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatId,
      }),
    });

    setShowConfirmDelete(false);
    setChatList((prev) => prev.filter((chat) => chat._id !== chatId));

    router.replace("/chat");
  };

  return (
    <Link
      className={`side-menu-item ${
        chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""
      }`}
      href={`/chat/${chat._id}`}
    >
      <FontAwesomeIcon
        icon={faMessage}
        className={`${chatId === chat._id ? "text-white" : "text-white/50"}`}
      />
      <span
        title={chat.title}
        className="overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {chat.title}
      </span>
      {!isGeneratingResponse && showConfirmDelete ? (
        <Fragment>
          <FontAwesomeIcon
            className="ml-auto text-green-400 hover:cursor-pointer"
            icon={faCheck}
            onClick={() => handleDeleteChat(chat._id)}
          />
          <FontAwesomeIcon
            className="text-red-500 hover:cursor-pointer"
            icon={faTimes}
            onClick={() => setShowConfirmDelete(false)}
          />
        </Fragment>
      ) : (
        <FontAwesomeIcon
          icon={faTrash}
          className="ml-auto text-white/50 hover:text-white"
          onClick={() => setShowConfirmDelete(true)}
        />
      )}
    </Link>
  );
};

export default ChatSidebarItem;
