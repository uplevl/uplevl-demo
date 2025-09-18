"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import Button from "@/components/button";
import Logo from "@/components/logo";
import PropertyGroupCard from "@/components/property-group-card";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import { GENERATE_SCRIPTS_EVENT } from "@/constants/events";
import usePostGroups from "@/hooks/use-post-groups";
import useTriggerInngestEvent from "@/hooks/use-trigger-inngest-event";
import { formatPrice } from "@/lib/utils";
import type { Post } from "@/repositories/post.repository";
import type { PostMediaGroup } from "@/repositories/post-media-group.repository";

export default function PostResultsPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);
  const router = useRouter();
  const triggerInngestEvent = useTriggerInngestEvent();

  const { data, isLoading } = usePostGroups(postId);

  if (isLoading) {
    return (
      <View className="items-center gap-8">
        <Logo />
        <Spinner />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="items-center gap-8">
        <Logo />
        <Typography>No data found</Typography>
      </View>
    );
  }

  if (data.error) {
    return (
      <View className="items-center gap-8">
        <Logo />
        <Typography>Error: {data.error}</Typography>
      </View>
    );
  }

  let buttonLabel = "Done";
  if (!data.data.post.hasVideoReels) buttonLabel = "Generate Video Reels";
  if (!data.data.post.hasScripts) buttonLabel = "Generate Voice Over Scripts";

  async function handleNextStep() {
    if (data?.data.post.hasScripts === false) {
      const { eventId } = await triggerInngestEvent(GENERATE_SCRIPTS_EVENT, { postId });
      router.push(`/processing/progress/scripting/${eventId}`);
    }
  }

  return (
    <View className="items-center gap-8 pb-10">
      <Logo />
      <Typography size="xl" weight="semibold">
        Property Details
      </Typography>
      <PropertyGroups groups={data.data.groups} />
      <PropertyDetails post={data.data.post} />
      <Button variant="primary" size="xl" className="w-full" onClick={handleNextStep}>
        {buttonLabel}
      </Button>
    </View>
  );
}

interface PropertyGroupsProps {
  groups: PostMediaGroup[];
}

function PropertyGroups({ groups }: PropertyGroupsProps) {
  return (
    <div className="flex flex-col gap-4 w-full ">
      {groups.map((group) => (
        <PropertyGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

interface PropertyDetailsProps {
  post: Post;
}

function PropertyDetails({ post }: PropertyDetailsProps) {
  return (
    <ul className="flex flex-col gap-1 w-full border border-brand-yellow/20 bg-gradient-to-b from-brand-yellow/10 to-white rounded-lg p-4 pt-3 shadow-exploration1">
      <li className="flex items-center gap-4">
        <Typography as="dt" weight="semibold">
          Price:
        </Typography>
        <Typography as="dd">{formatPrice(post.propertyStats?.price ?? 0)}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="dt" weight="semibold">
          Beds:
        </Typography>
        <Typography as="dd">{post.propertyStats?.bedrooms}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="dt" weight="semibold">
          Baths:
        </Typography>
        <Typography as="dd">{post.propertyStats?.bathrooms}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="dt" weight="semibold">
          Sqft:
        </Typography>
        <Typography as="dd">{post.propertyStats?.squareFeet}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="dt" weight="semibold">
          Address:
        </Typography>
        <Typography as="dd">{post.location}</Typography>
      </li>
    </ul>
  );
}
