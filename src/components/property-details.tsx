import { Typography } from "@/components/typography";
import { formatPrice } from "@/lib/utils";
import { usePost } from "@/providers/post-provider";

/**
 * Displays property details from the current post context
 * Shows price, beds, baths, square footage, and address
 */
export default function PropertyDetails() {
  const post = usePost();

  if (!post) {
    return null;
  }
  return (
    <ul className="flex flex-col gap-1 w-full border border-brand-yellow/20 bg-gradient-to-b from-brand-yellow/10 to-white rounded-lg p-4 pt-3 shadow-exploration1">
      <li className="flex items-center gap-4">
        <Typography as="span" weight="semibold">
          Price:
        </Typography>
        <Typography as="span">{formatPrice(post.propertyStats?.price ?? 0)}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="span" weight="semibold">
          Beds:
        </Typography>
        <Typography as="span">{post.propertyStats?.bedrooms}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="span" weight="semibold">
          Baths:
        </Typography>
        <Typography as="span">{post.propertyStats?.bathrooms}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="span" weight="semibold">
          Sqft:
        </Typography>
        <Typography as="span">{post.propertyStats?.squareFeet}</Typography>
      </li>
      <li className="flex items-center gap-4">
        <Typography as="span" weight="semibold">
          Address:
        </Typography>
        <Typography as="span">{post.location}</Typography>
      </li>
    </ul>
  );
}
