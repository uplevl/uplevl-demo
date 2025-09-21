import axios from "axios";
import { env } from "@/env";

export const autoReelClient = axios.create({
  baseURL: "https://api.autoreelapp.com/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${env.AUTO_REEL_API_KEY}`,
  },
});
