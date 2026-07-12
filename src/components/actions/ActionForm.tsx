"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createActionAction,
  updateActionAction,
} from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import type { Action, ActionType } from "@/lib/types/action";

const ACTION_TYPES: ActionType[] = ["match", "training", "tournament", "cup", "other"];
const HOME_AWAY_TYPES: ActionType[] = ["match", "tournament", "cup"];

const schema = z.object({
  type: z.enum(["match", "training", "tournament", "cup", "other"]),
  title: z.string().min(1),
  opponent: z.string(),
  competition: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  time: z.union([z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"), z.literal("")]),
  location: z.string(),
  isHome: z.boolean(),
  ourScore: z.number().int().min(0).nullable(),
  theirScore: z.number().int().min(0).nullable(),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

// Server Components can't pass Firestore Timestamp instances to Client
// Components — the caller strips createdAt/updatedAt before passing down.
type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface RosterPlayer {
  id: string;
  displayName: string;
  jerseyNumber: number | null;
}

interface ActionFormProps {
  teamId: string;
  seasonId: string;
  roster: RosterPlayer[];
  action?: ClientSafeAction;
}

export function ActionForm({ teamId, seasonId, roster, action }: ActionFormProps) {
  const t = useTranslations("actions");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [squadPlayerIds, setSquadPlayerIds] = useState<string[]>(action?.squadPlayerIds ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: action?.type ?? "match",
      title: action?.title ?? "",
      opponent: action?.opponent ?? "",
      competition: action?.competition ?? "",
      date: action?.date ?? "",
      time: action?.time ?? "",
      location: action?.location ?? "",
      isHome: action?.isHome ?? true,
      ourScore: action?.result?.ourScore ?? null,
      theirScore: action?.result?.theirScore ?? null,
      description: action?.description ?? "",
    },
  });

  const type = watch("type");
  const isHome = watch("isHome");
  const showHomeAway = HOME_AWAY_TYPES.includes(type);
  const showOpponent = HOME_AWAY_TYPES.includes(type);
  const showResult = type === "match";

  function toggleSquadPlayer(playerId: string) {
    setSquadPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId],
    );
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result =
        showResult && values.ourScore !== null && values.theirScore !== null
          ? { ourScore: values.ourScore, theirScore: values.theirScore }
          : null;

      const input = {
        seasonId,
        type: values.type,
        title: values.title,
        opponent: showOpponent ? values.opponent || null : null,
        competition: values.competition || null,
        date: values.date,
        time: values.time || null,
        location: values.location || null,
        isHome: showHomeAway ? values.isHome : null,
        result,
        squadPlayerIds,
        description: values.description || null,
      };

      if (action) {
        await updateActionAction(action.id, input);
      } else {
        await createActionAction(teamId, input);
      }
      toast.success(t(action ? "updated" : "created"));
      // No router.refresh() here: calling it immediately after push()
      // interrupts the in-flight transition (confirmed via live testing) —
      // push() to a route not yet in the router cache already fetches a
      // fresh RSC payload for the destination on its own.
      router.push(`/teams/${teamId}/admin?season=${seasonId}`);
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="type">{t("typeLabel")}</Label>
        <Select value={type} onValueChange={(value: string | null) => {
          if (value) setValue("type", value as ActionType);
        }}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((actionType) => (
              <SelectItem key={actionType} value={actionType}>
                {t(`type.${actionType}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">{t("titleField")}</Label>
        <Input id="title" placeholder={t("titlePlaceholder")} {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {showOpponent && (
        <div className="space-y-1.5">
          <Label htmlFor="opponent">{t("opponent")}</Label>
          <Input id="opponent" placeholder={t("opponentPlaceholder")} {...register("opponent")} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="competition">{t("competition")}</Label>
        <Input id="competition" {...register("competition")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">{t("date")}</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">{t("time")}</Label>
          <Input id="time" type="time" {...register("time")} />
          {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">{t("location")}</Label>
        <Input id="location" {...register("location")} />
      </div>

      {showHomeAway && (
        <div className="flex items-center gap-2">
          <Switch
            id="isHome"
            checked={isHome}
            onCheckedChange={(checked) => setValue("isHome", checked)}
          />
          <Label htmlFor="isHome">{t("isHome")}</Label>
        </div>
      )}

      {showResult && (
        <div className="space-y-1.5">
          <Label>{t("result")}</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min={0}
              placeholder={t("ourScore")}
              aria-label={t("ourScore")}
              {...register("ourScore", {
                setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
              })}
            />
            <Input
              type="number"
              min={0}
              placeholder={t("theirScore")}
              aria-label={t("theirScore")}
              {...register("theirScore", {
                setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
              })}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>{t("squad")}</Label>
        <p className="text-xs text-muted-foreground">{t("squadHint")}</p>
        {roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPlayersOnRoster")}</p>
        ) : (
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
            {roster.map((player) => (
              <label key={player.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={squadPlayerIds.includes(player.id)}
                  onCheckedChange={() => toggleSquadPlayer(player.id)}
                />
                {player.displayName}
                {player.jerseyNumber != null && ` #${player.jerseyNumber}`}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("description")}</Label>
        <Input id="description" {...register("description")} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tc("saving") : t("save")}
      </Button>
    </form>
  );
}
