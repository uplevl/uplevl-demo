"use server";

import { inngest } from "@/inngest/client";

export default async function triggerInngestEvent<T>(eventName: string, data: T) {
  const eventResult = await inngest.send({
    name: eventName,
    data,
  });
  return eventResult.ids[0];
}
