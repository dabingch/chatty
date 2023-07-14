import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);

    if (req.method !== "POST") {
      res.status(405).json({ message: "Method not allowed" });
      return;
    }
    const { chatId } = req.body;

    if (!chatId) {
      res.status(400).json({ message: "Chat ID is required" });
      return;
    }

    const client = await clientPromise;
    const db = client.db("chatty");
    await db
      .collection("chats")
      .findOneAndDelete({ _id: new ObjectId(chatId), userId: user.sub });

    res.status(200).json({ message: "Delete chat successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
