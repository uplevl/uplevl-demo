import { getApi } from "@/lib/api";

export default async function getJobById(id: string) {
  const api = await getApi();
  const result = await api.jobs[":id"].$get({ param: { id } });
  return result.json();
}
