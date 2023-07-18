import { OpenAIEdgeStream } from "openai-edge-stream";

// next.js config, to make the request timeout to 30 seconds
// default is 10 seconds with the free plan
export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json(); // equal to JSON.parse(req.body)

    let chatId = chatIdFromParam;

    if (
      !message &&
      typeof message !== "string" &&
      message.trim().length > 200
    ) {
      return new Response(
        {
          message: "Message must be a string and less than 200 characters",
        },
        {
          status: 400,
        }
      );
    }

    const initialMessage = {
      role: "system",
      content:
        "Your name is 小饼. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. Your were created by 大饼, Your response must be formatted as markdown",
    };

    let newChatId;
    let chatMessages = [];

    // If chat id exists, add message to chat
    if (chatId) {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );

      const data = await response.json();
      chatMessages = data.chat.messages || [];
    } else {
      // New Messages
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message,
          }),
        }
      );

      const data = await response.json();
      chatId = data._id;
      newChatId = data._id;
      chatMessages = data.messages || [];
    }

    const messagesToInclude = [];
    chatMessages.reverse(); // latest messages come first
    // Check if the messages from user and robot exceed 2000 tokens
    // Limit is 4000 tokens, about 16000 characters
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens += messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }

    messagesToInclude.reverse();

    const stream = await OpenAIEdgeStream(
      "https://api.chatanywhere.cn/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [initialMessage, ...messagesToInclude], // token limit in messages
          stream: true, // stream message to make interface user-friendly
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          // if it is a new chat, send a event to client named "newChatId"
          if (newChatId) {
            emit(chatId, "newChatId");
          }
        },
        onAfterStream: async ({ fullContent }) => {
          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "PUT",
              headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie"),
              },
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );

    return new Response(stream);
  } catch (error) {
    return new Response(
      {
        message: "An error occurred in send message",
      },
      {
        status: 500,
      }
    );
  }
}
