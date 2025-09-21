import { useQueryClient } from "@tanstack/react-query";
import { createContext, use } from "react";
import usePostGroups from "@/hooks/use-post-groups";
import type { Post } from "@/repositories/post.repository";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";

interface PostProviderContextProps {
  post: Post | null;
  groups: PostMediaGroup[];
  isLoading: boolean;
  refetch: () => void;
}

const PostProviderContext = createContext<PostProviderContextProps>({} as PostProviderContextProps);

interface PostProviderProps {
  children: React.ReactNode;
  postId: string;
}

export default function PostProvider({ children, postId }: PostProviderProps) {
  const { data, isLoading } = usePostGroups(postId);
  const queryClient = useQueryClient();

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["post-results", postId] });
  }

  const context: PostProviderContextProps = {
    post: data?.data.post ?? null,
    groups: data?.data.groups ?? [],
    isLoading,
    refetch,
  };

  return <PostProviderContext.Provider value={context}>{children}</PostProviderContext.Provider>;
}

function usePostContext() {
  const context = use(PostProviderContext);
  if (context === undefined) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
}

export function usePost() {
  const { post } = usePostContext();
  return post;
}

export function useGroups() {
  const { groups } = usePostContext();
  return groups;
}

export function useGroup(groupId: string) {
  const { groups } = usePostContext();
  const group = groups.find((group) => group.id === groupId);
  if (!group) {
    throw new Error("Group not found");
  }
  return group;
}

export function useGroupMedia(groupId: string) {
  const group = useGroup(groupId);
  return group.media;
}

export function useIsLoading() {
  const { isLoading } = usePostContext();
  return isLoading;
}

export function useRefetchPostGroups() {
  const { refetch } = usePostContext();
  return refetch;
}
