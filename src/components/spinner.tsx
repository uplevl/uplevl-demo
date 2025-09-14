import { LoaderCircleIcon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center p-20">
      <LoaderCircleIcon className="size-10 animate-spin" />
    </div>
  );
}
