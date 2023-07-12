import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  try {
    const { message } = await req.json(); // equal to JSON.parse(req.body)

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
