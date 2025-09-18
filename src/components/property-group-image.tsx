import { THUMBNAIL_SIZES } from "@/constants/image";
import ImageWithThumbnail from "./image-with-thumbnail";

interface PropertyGroupImageProps {
  mediaUrl: string;
  description: string;
}

export default function PropertyGroupImage({ mediaUrl, description }: PropertyGroupImageProps) {
  return (
    <ImageWithThumbnail
      src={mediaUrl}
      alt={description}
      thumbnailSize={THUMBNAIL_SIZES.SMALL}
      width={250}
      height={250}
      className="object-cover aspect-square rounded-lg"
    />
  );
}
