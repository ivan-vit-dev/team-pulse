"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { updateTeamLogoAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/firebase/client";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

interface TeamLogoUploaderProps {
  teamId: string;
  teamName: string;
  logoURL: string | null;
}

export function TeamLogoUploader({ teamId, teamName, logoURL }: TeamLogoUploaderProps) {
  const t = useTranslations("teams");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > MAX_LOGO_BYTES) {
      toast.error(ta("genericError"));
      return;
    }

    setIsUploading(true);
    try {
      const logoRef = ref(storage, `teams/${teamId}/${file.name}`);
      await uploadBytes(logoRef, file);
      const url = await getDownloadURL(logoRef);
      await updateTeamLogoAction(teamId, url);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 rounded-lg">
        {logoURL && <AvatarImage src={logoURL} alt="" />}
        <AvatarFallback className="rounded-lg">{teamName.slice(0, 2).toUpperCase()}</AvatarFallback>
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
          {isUploading ? tc("saving") : t("uploadLogo")}
        </Button>
      </div>
    </div>
  );
}
