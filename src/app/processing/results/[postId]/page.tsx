"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use } from "react";
import Button from "@/components/button";
import Logo from "@/components/logo";
import Spinner from "@/components/spinner";
import { Typography } from "@/components/typography";
import View from "@/components/view";
import useApi from "@/hooks/use-api";
import type { getById } from "@/server/repositories/post.repository";
import type { getByPostId } from "@/server/repositories/post-media-group.repository";

export default function PostResultsPage({ params }: { params: Promise<{ postId: string }> }) {
  const api = useApi();
  const { postId } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["post-results", postId],
    queryFn: async () => {
      const response = await api.posts[`:postId`].groups.$get({
        param: { postId },
      });
      return response.json();
    },
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

  return (
    <View className="items-center gap-8 pb-10">
      <Logo />
      <Typography size="2xl" weight="bold">
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
    <div className="flex flex-col gap-6 w-full">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          <Typography as="h3" size="xl" weight="semibold">
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
    <ul className="flex flex-col gap-1 w-full">
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
