"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { addVideoLinkAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getVideoEmbedUrl } from "@/lib/media/video-url";

interface AddVideoLinkDialogProps {
  actionId: string;
  teamId: string;
}

export function AddVideoLinkDialog({ actionId, teamId }: AddVideoLinkDialogProps) {
  const t = useTranslations("media");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    url: z
      .string()
      .trim()
      .refine((url) => getVideoEmbedUrl(url) !== null, t("videoUrlInvalid")),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await addVideoLinkAction(actionId, teamId, values.url);
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            {t("addVideoLink")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addVideoLink")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <Input
              type="url"
              placeholder={t("videoUrlPlaceholder")}
              {...register("url")}
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {t("addVideo")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
