import { getInitials } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  image?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizes = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
};

export default function Avatar({ name, image, size = "md" }: AvatarProps) {
  const cls = `${sizes[size]} rounded-full flex-shrink-0 overflow-hidden`;
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name || "avatar"} className={`${cls} object-cover`} />
    );
  }
  return (
    <div className={`${cls} bg-blue-100 flex items-center justify-center font-semibold text-blue-700`}>
      {getInitials(name)}
    </div>
  );
}
