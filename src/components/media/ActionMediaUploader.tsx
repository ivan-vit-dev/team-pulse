"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { createMediaAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/firebase/client";

const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

interface ActionMediaUploaderProps {
  actionId: string;
  teamId: string;
}

export function ActionMediaUploader({ actionId, teamId }: ActionMediaUploaderProps) {
  const t = useTranslations("media");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > MAX_MEDIA_BYTES) {
      toast.error(ta("genericError"));
      return;
    }

    setIsUploading(true);
    try {
      const mediaRef = ref(storage, `actions/${actionId}/${file.name}`);
      await uploadBytes(mediaRef, file);
      const url = await getDownloadURL(mediaRef);
      await createMediaAction(actionId, teamId, url);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
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
        {isUploading ? tc("saving") : t("upload")}
      </Button>
    </div>
  );
}
