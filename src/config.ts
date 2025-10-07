import dotenv from "dotenv";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, BOT_INVITE_URL, SUPPORT_SERVER_URL, SEND_STARTUP_EMBED, BROADCAST_CHANNEL_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  BOT_INVITE_URL,
  SUPPORT_SERVER_URL,
  SEND_STARTUP_EMBED,
  BROADCAST_CHANNEL_ID,
};
