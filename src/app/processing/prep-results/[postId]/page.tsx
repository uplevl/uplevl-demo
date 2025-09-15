"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use } from "react";

import getPostGroupsByPostId from "@/actions/get-post-groups-by-post-id";
import Button from "@/components/button";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import type { getById } from "@/server/repositories/post.repository";
import type { getByPostId } from "@/server/repositories/post-media-group.repository";

export default function PostResultsPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["post-results", postId],
    queryFn: async () => getPostGroupsByPostId(postId),
  });

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

  return (
    <View className="items-center gap-8 pb-10">
      <Logo />
      <Typography size="xl" weight="semibold">
        Property Details
      </Typography>
      <PropertyGroups groups={data.data.groups} />
      <PropertyDetails post={data.data.post} />
      <Button variant="primary" size="xl" className="w-full" onClick={() => router.push(`/processing/reels/${postId}`)}>
        Generate Video Reels
      </Button>
    </View>
  );
}

interface PropertyGroupsProps {
  groups: NonNullable<Awaited<ReturnType<typeof getByPostId>>>;
}

function PropertyGroups({ groups }: PropertyGroupsProps) {
  return (
    <div className="flex flex-col gap-4 w-full ">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2.5 bg-white rounded-xl p-2.5 shadow-exploration2">
          <Typography as="h3" weight="semibold" className="ml-0.5 leading-4">
            {group.groupName}
          </Typography>
          <div className="grid grid-cols-4 gap-1">
            {group.media.map((media) => (
              <Image
                src={media.mediaUrl}
                key={media.id}
                alt={media.description ?? ""}
                width={250}
                height={250}
                className="object-cover aspect-square rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface PropertyDetailsProps {
  post: NonNullable<Awaited<ReturnType<typeof getById>>>;
}

function PropertyDetails({ post }: PropertyDetailsProps) {
  return (
    <ul className="flex flex-col gap-1 w-full border border-gray-100/60 bg-gradient-to-b from-gray-100/40 to-gray-100/10 rounded-lg p-4 pt-3 shadow-exploration2">
      <li className="flex items-center gap-4">
        <Typography as="dt" weight="semibold">
          Price:
        </Typography>
        <Typography as="dd">{post.propertyStats?.price}</Typography>
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
