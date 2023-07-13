import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { message } = req.body;
    const newUserMessage = {
      role: "user",
      content: message,
    };

    const client = await clientPromise;
    const db = await client.db("chatty");
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
    console.log("ERROR", error);
  }
}
