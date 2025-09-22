import { useQueryClient } from "@tanstack/react-query";
import { createContext, use } from "react";
import usePostGroups from "@/hooks/use-post-groups";
import type { Post } from "@/repositories/post.repository";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";

interface PostProviderContextProps {
  /** The post data */
  post: Post | null;
  /** The media groups for the post */
  groups: PostMediaGroup[];
  /** Whether the post data is currently loading */
  isLoading: boolean;
  /** Refetch the post data */
  refetch: () => void;
}

const PostProviderContext = createContext<PostProviderContextProps>({} as PostProviderContextProps);

interface PostProviderProps {
  children: React.ReactNode;
  /** The ID of the post to get the data for */
  postId: string;
}

/**
 * Provides the post and media groups for a specific post
 * @param children - The children to render
 * @param postId - The ID of the post to get the data for
 * @returns PostProvider context
 */
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

/**
 * Returns the PostProvider context
 * @returns PostProvider context
 */
function usePostContext() {
  const context = use(PostProviderContext);
  if (context === undefined) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
}

/**
 * Returns the current post from the PostProvider context
 * @returns The post data or null if not loaded
 */
export function usePost(): Post | null {
  const { post } = usePostContext();
  return post;
}

/**
 * Returns all media groups from the PostProvider context
 * @returns Array of post media groups
 */
export function useGroups(): PostMediaGroup[] {
  const { groups } = usePostContext();
  return groups;
}

/**
 * Returns the media group for a specific group from the PostProvider context
 * @param groupId - The ID of the group to get the media group for
 * @returns Media group
 */
export function useGroup(groupId: string) {
  const { groups } = usePostContext();
  const group = groups.find((group) => group.id === groupId);
  if (!group) {
    throw new Error("Group not found");
  }
  return group;
}

/**
 * Returns the media for a specific group from the PostProvider context
 * @param groupId - The ID of the group to get the media for
 * @returns Array of media items
 */
export function useGroupMedia(groupId: string) {
  const group = useGroup(groupId);
  return group.media;
}

/**
 * Returns the loading state from the PostProvider context
 * @returns Boolean indicating if post data is currently loading
 */
export function useIsLoading() {
  const { isLoading } = usePostContext();
  return isLoading;
}

/**
 * Returns the refetch function from the PostProvider context
 * @returns Refetch function
 */
export function useRefetchPostGroups() {
  const { refetch } = usePostContext();
  return refetch;
}
