import type { ActivationActionLink } from "@/features/activation/types";

export interface SurfacePurpose {
  kicker: string;
  title: string;
  description: string;
  primaryAction?: ActivationActionLink;
  searchPlaceholder?: string;
}

export interface StateExplanation {
  title: string;
  description: string;
  statusHint?: string;
}

export function asSinglePrimaryAction(primaryAction?: ActivationActionLink) {
  return primaryAction ? [primaryAction] : [];
}

export function buildStateExplanation(input: StateExplanation): StateExplanation {
  return input;
}
