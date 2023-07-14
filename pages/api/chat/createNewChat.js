import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { message } = req.body;

    if (
      !message &&
      typeof message !== "string" &&
      message.trim().length > 200
    ) {
      res.status(400).json({
        message: "Message must be a string and less than 200 characters",
      });
      return;
    }

    const newUserMessage = {
      role: "user",
      content: message,
    };

    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("chatty");
    const chat = await db.collection("chats").insertOne({
      userId: user.sub,
      messages: [newUserMessage],
      title: message,
    });

    res.status(201).json({
      _id: chat.insertedId.toString(),
      messages: [newUserMessage],
      title: message,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating chat" });
  }
}
