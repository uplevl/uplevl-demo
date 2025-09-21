"use client";

import { CogIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Button from "@/components/button";
import Logo from "@/components/logo";
import PropertyDetails from "@/components/property-details";
import PropertyGroups from "@/components/property-groups";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import { GENERATE_SCRIPTS_EVENT } from "@/constants/events";
import useTriggerInngestEvent from "@/hooks/use-trigger-inngest-event";
import PostProvider, { useGroups, useIsLoading, usePost } from "@/providers/post-provider";

export default function PostResultsPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);

  return (
    <PostProvider postId={postId}>
      <PostResultsPageContent />
    </PostProvider>
  );
}

function PostResultsPageContent() {
  const router = useRouter();
  const triggerInngestEvent = useTriggerInngestEvent();
  const isLoading = useIsLoading();
  const post = usePost();
  const groups = useGroups();

  if (isLoading) {
    return (
      <View className="items-center gap-8">
        <Logo />
        <Spinner />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="items-center gap-8">
        <Logo />
        <Typography>No data found</Typography>
      </View>
    );
  }

  const numberOfGroups = groups.length;
  const numberOfGeneratedVoiceOver = groups.filter((group) => group.audioUrl).length;
  const hasAllVoiceOverGenerated = numberOfGeneratedVoiceOver === numberOfGroups;

  let buttonLabel = "Done";
  if (post.hasAutoReels && hasAllVoiceOverGenerated) buttonLabel = "Generate Social Media Reels";
  if (!post.hasAutoReels && hasAllVoiceOverGenerated) buttonLabel = "Generate Video Clips";
  if (!post.hasScripts) buttonLabel = "Generate Voice Over Scripts";

  async function handleNextStep() {
    if (post?.hasScripts === false) {
      const { eventId } = await triggerInngestEvent(GENERATE_SCRIPTS_EVENT, { postId: post.id });
      router.push(`/processing/progress/scripting/${eventId}`);
    }
  }

  return (
    <View className="items-center gap-8 pb-10">
      <Logo />
      <Typography size="xl" weight="semibold">
        Property Details
      </Typography>
      <PropertyGroups />
      <PropertyDetails />
      <Button variant="primary" size="xl" className="w-full" onClick={handleNextStep}>
        <CogIcon className="size-4" />
        {buttonLabel}
      </Button>
    </View>
  );
}
