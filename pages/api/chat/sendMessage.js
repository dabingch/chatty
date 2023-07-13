import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json(); // equal to JSON.parse(req.body)

    let chatId = chatIdFromParam;

    const initialMessage = {
      role: "system",
      content:
        "Your name is 小饼. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. Your were created by 大饼, Your response must be formatted as markdown",
    };

    let newChatId;

    // If chat id exists, add message to chat
    if (chatId) {
      const resposne = await fetch(
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
    } else {
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
    }

    const stream = await OpenAIEdgeStream(
      "https://api.chatanywhere.com.cn/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            initialMessage,
            {
              content: message,
              role: "user",
            },
          ],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
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
    console.log(error);
  }
}
