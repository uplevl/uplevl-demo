import axios from "axios";
import { env } from "@/env";

export const brightDataClient = axios.create({
  baseURL: "https://api.brightdata.com/datasets/v3",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.BRIGHT_DATA_API_KEY}`,
  },
});
