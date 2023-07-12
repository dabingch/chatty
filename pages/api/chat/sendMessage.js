import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  try {
    const { message } = await req.json(); // equal to JSON.parse(req.body)

    const initialMessage = {
      role: "system",
      content:
        "Your name is 小饼. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. Your were created by 大饼, Your response must be formatted as markdown",
    };

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
      }
    );

    return new Response(stream);
  } catch (error) {
    console.log(error);
  }
}
