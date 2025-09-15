import { getApi } from "@/lib/api";

export default async function getPostGroupsByPostId(postId: string) {
  const api = await getApi();
  const response = await api.posts[`:postId`].groups.$get({
    param: { postId },
  });
  return response.json();
}
