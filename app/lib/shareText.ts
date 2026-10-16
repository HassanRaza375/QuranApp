// The text of the plain Share button (the format Home's ayah already uses): the Arabic, the translation when one is shown,
// then the reference.
export interface ShareInput {
  arabic: string;
  translation: string | null;
  name: string;
  surah: number;
  ayah: number;
}

export const ayahReference = (i: Pick<ShareInput, "name" | "surah" | "ayah">) => `${i.name} ${i.surah}:${i.ayah}`;

export function ayahShareText(i: ShareInput): string {
  return [i.arabic, i.translation, ayahReference(i)].filter((p): p is string => !!p).join("\n\n");
}
