import useApi from "./use-api";

export default function useTriggerInngestEvent() {
  const api = useApi();

  async function triggerInngestEvent<T>(eventName: string, data: T) {
    const response = await api.events.inngest.$post({
      json: { eventName, data },
    });

    return response.json();
  }

  return triggerInngestEvent;
}
