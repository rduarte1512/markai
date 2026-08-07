import type { PlanKey } from "@/lib/types";

export type ImageModelKey = "nano-banana-2" | "nano-banana-pro";
export type ImageSize = "1K" | "2K" | "4K";
export type VideoModelKey = "veo-3.1-lite" | "veo-3.1-fast" | "veo-3.1" | "gemini-omni-flash";
export type VideoResolution = "720p" | "1080p" | "4k";
export type VideoDuration = 4 | 6 | 8;

export const IMAGE_MODELS: Record<ImageModelKey, {
  label: string;
  providerModel: string;
  plans: PlanKey[];
  baseCredits: Record<PlanKey, number>;
}> = {
  "nano-banana-2": {
    label: "Nano Banana 2",
    providerModel: "gemini-3.1-flash-image",
    plans: ["free", "starter", "pro", "agency"],
    baseCredits: { free: 90, starter: 45, pro: 35, agency: 30 },
  },
  "nano-banana-pro": {
    label: "Nano Banana Pro",
    providerModel: "gemini-3-pro-image",
    plans: ["pro", "agency"],
    baseCredits: { free: 0, starter: 0, pro: 85, agency: 70 },
  },
};

const imageSizeMultiplier: Record<ImageSize, number> = { "1K": 1, "2K": 1.55, "4K": 2.5 };

export function getImageCreditCost(plan: PlanKey, model: ImageModelKey, size: ImageSize) {
  const config = IMAGE_MODELS[model];
  if (!config.plans.includes(plan)) return null;
  return Math.ceil(config.baseCredits[plan] * imageSizeMultiplier[size]);
}

export const VIDEO_MODELS: Record<VideoModelKey, {
  label: string;
  providerModel: string;
  plans: PlanKey[];
  creditsPerSecond: number;
  resolutions: VideoResolution[];
  provider: "veo" | "omni";
}> = {
  "veo-3.1-lite": {
    label: "Veo 3.1 Lite",
    providerModel: "veo-3.1-lite-generate-preview",
    plans: ["starter", "pro", "agency"],
    creditsPerSecond: 28,
    resolutions: ["720p", "1080p"],
    provider: "veo",
  },
  "veo-3.1-fast": {
    label: "Veo 3.1 Fast",
    providerModel: "veo-3.1-fast-generate-preview",
    plans: ["starter", "pro", "agency"],
    creditsPerSecond: 48,
    resolutions: ["720p", "1080p", "4k"],
    provider: "veo",
  },
  "veo-3.1": {
    label: "Veo 3.1",
    providerModel: "veo-3.1-generate-preview",
    plans: ["pro", "agency"],
    creditsPerSecond: 90,
    resolutions: ["720p", "1080p", "4k"],
    provider: "veo",
  },
  "gemini-omni-flash": {
    label: "Gemini Omni Flash",
    providerModel: "gemini-omni-flash-preview",
    plans: ["pro", "agency"],
    creditsPerSecond: 145,
    resolutions: ["720p", "1080p"],
    provider: "omni",
  },
};

const videoResolutionMultiplier: Record<VideoResolution, number> = { "720p": 1, "1080p": 1.6, "4k": 2.55 };

export function getVideoCreditCost(plan: PlanKey, model: VideoModelKey, duration: VideoDuration, resolution: VideoResolution) {
  const config = VIDEO_MODELS[model];
  if (!config.plans.includes(plan) || !config.resolutions.includes(resolution)) return null;
  if ((resolution === "1080p" || resolution === "4k") && duration !== 8 && config.provider === "veo") return null;
  return Math.ceil(config.creditsPerSecond * duration * videoResolutionMultiplier[resolution]);
}

export type AgentAttachment = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  text?: string;
};

export function estimateAttachmentBytes(attachment: AgentAttachment) {
  if (attachment.dataUrl) {
    const base64 = attachment.dataUrl.split(",")[1] || "";
    return Math.ceil((base64.length * 3) / 4);
  }
  if (attachment.text) return Buffer.byteLength(attachment.text, "utf8");
  return Math.max(0, Number(attachment.size || 0));
}

export function getAttachmentCreditCost(bytes: number) {
  if (bytes <= 100 * 1024) return 2;
  if (bytes <= 500 * 1024) return 5;
  if (bytes <= 2 * 1024 * 1024) return 12;
  if (bytes <= 5 * 1024 * 1024) return 24;
  return 40;
}
