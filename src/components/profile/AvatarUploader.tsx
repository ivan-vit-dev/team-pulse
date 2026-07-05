"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { updateAvatarAction } from "@/app/[locale]/(app)/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { storage } from "@/lib/firebase/client";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

interface AvatarUploaderProps {
  displayName: string;
  photoURL: string | null;
}

export function AvatarUploader({ displayName, photoURL }: AvatarUploaderProps) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES) {
      toast.error(ta("genericError"));
      return;
    }

    setIsUploading(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      await updateAvatarAction(url);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {photoURL && <AvatarImage src={photoURL} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? tc("saving") : t("uploadAvatar")}
        </Button>
      </div>
    </div>
  );
}
