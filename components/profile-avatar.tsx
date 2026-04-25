import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Mail, User } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";

interface ProfileAvatarProps {
  profileImageUrl?: string;
  fallbackName?: string;
  email?: string;
  isLoading?: boolean;
}

export function ProfileAvatar({
  profileImageUrl,
  fallbackName,
  email,
  isLoading,
}: ProfileAvatarProps) {
  if (isLoading) {
    return (
      <Avatar className="flex items-center justify-center bg-muted">
        <Spinner width={15} height={15} />
      </Avatar>
    );
  }

  const fallbackInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts[0][0].toUpperCase();
  };

  const initials = fallbackInitials(fallbackName!);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={profileImageUrl} />
          <AvatarFallback className=" bg-black text-white font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2">
            <User height={14} width={14} />
            {fallbackName}
          </DropdownMenuLabel>
          <DropdownMenuLabel className="text-muted-foreground -mt-3 flex items-center gap-2">
            <Mail className="mt-0.5" height={14} width={14} />
            {email}
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/user/profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={"destructive"}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
