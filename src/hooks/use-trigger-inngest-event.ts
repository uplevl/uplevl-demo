import type { GENERATE_AUTO_REEL_EVENT, GENERATE_SCRIPTS_EVENT, PARSE_ZILLOW_PROPERTY_EVENT } from "@/constants/events";
import useApi from "./use-api";

type EventName = typeof PARSE_ZILLOW_PROPERTY_EVENT | typeof GENERATE_SCRIPTS_EVENT | typeof GENERATE_AUTO_REEL_EVENT;

export default function useTriggerInngestEvent() {
  const api = useApi();

  async function triggerInngestEvent<T>(eventName: EventName, data: T) {
    const response = await api.events.inngest.$post({
      json: { eventName, data },
    });

    return response.json();
  }

  return triggerInngestEvent;
}
