import PropertyGroupCard from "@/components/property-group-card";
import { useGroups } from "@/providers/post-provider";

export default function PropertyGroups() {
  const groups = useGroups();

  return (
    <div className="flex flex-col gap-4 w-full ">
      {groups.map((group) => (
        <PropertyGroupCard key={group.id} groupId={group.id} />
      ))}
    </div>
  );
}
