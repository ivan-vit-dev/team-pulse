"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { updatePlayerAvatarAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/firebase/client";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

interface PlayerAvatarUploaderProps {
  playerId: string;
  displayName: string;
  avatarURL: string | null;
  onUploaded: (url: string) => void;
}

export function PlayerAvatarUploader({
  playerId,
  displayName,
  avatarURL,
  onUploaded,
}: PlayerAvatarUploaderProps) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES) {
      toast.error(ta("genericError"));
      return;
    }

    setIsUploading(true);
    try {
      const avatarRef = ref(storage, `players/${playerId}/${file.name}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      await updatePlayerAvatarAction(playerId, url);
      onUploaded(url);
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {avatarURL && <AvatarImage src={avatarURL} alt="" />}
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
