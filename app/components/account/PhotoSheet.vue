<script setup lang="ts">
// Choosing a profile photo (screen 06): pick a file, zoom and move it inside a circle, use it. The crop is made here in the browser; the server signs the
// upload and Cloudinary crops again to 256 px. A JPG, PNG or WebP under 2 MB. Nothing is uploaded until "Use photo".
import { account, uploadAvatar } from "~/lib/sync/runtime";

const emit = defineEmits<{ close: [] }>();
const MAX_BYTES = 2 * 1024 * 1024;
const FORMATS = ["image/jpeg", "image/png", "image/webp"];

const input = ref<HTMLInputElement | null>(null);
const img = shallowRef<HTMLImageElement | null>(null);
const url = ref("");
const zoom = ref(1);
const x = ref(0);
const y = ref(0);
const message = ref("");
const VIEW = 192;

function pick(e: Event) {
  message.value = "";
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!FORMATS.includes(file.type)) return void (message.value = "Choose a JPG, PNG or WebP image.");
  if (file.size > MAX_BYTES) return void (message.value = "That image is over 2 MB. Choose a smaller one.");
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = URL.createObjectURL(file);
  const i = new Image();
  i.onload = () => {
    img.value = i;
    zoom.value = 1;
    x.value = 0;
    y.value = 0;
  };
  i.onerror = () => (message.value = "That image could not be read.");
  i.src = url.value;
}
onBeforeUnmount(() => url.value && URL.revokeObjectURL(url.value));

/** the square of the image that is inside the circle: its side, and its top-left corner, in image pixels */
function region(i: HTMLImageElement) {
  const base = Math.min(i.naturalWidth, i.naturalHeight);
  const side = base / zoom.value;
  const maxX = (i.naturalWidth - side) / 2;
  const maxY = (i.naturalHeight - side) / 2;
  return { side, sx: (i.naturalWidth - side) / 2 + (x.value / 100) * maxX, sy: (i.naturalHeight - side) / 2 + (y.value / 100) * maxY };
}
const previewStyle = computed(() => {
  const i = img.value;
  if (!i) return {};
  const r = region(i);
  const scale = VIEW / r.side;
  return { backgroundImage: `url(${url.value})`, backgroundSize: `${i.naturalWidth * scale}px ${i.naturalHeight * scale}px`, backgroundPosition: `${-r.sx * scale}px ${-r.sy * scale}px` };
});

async function use() {
  const i = img.value;
  if (!i) return;
  const r = region(i);
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  c.getContext("2d")!.drawImage(i, r.sx, r.sy, r.side, r.side, 0, 0, 512, 512);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.9));
  if (!blob) return void (message.value = "That image could not be prepared.");
  if (await uploadAvatar(blob)) emit("close");
  else message.value = account.error;
}
</script>

<template>
  <div class="mt-3 max-w-[420px] rounded-[10px] border p-4" role="group" aria-label="Choose a profile photo" data-testid="photo-sheet">
    <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-label="Photo file" data-testid="photo-file" @change="pick" />
    <Button type="button" variant="outline" class="min-h-11 md:min-h-9" @click="input?.click()">Choose a file</Button>
    <div v-if="img" class="mt-3 flex flex-col items-center gap-3">
      <div class="rounded-full border" :style="{ width: `${VIEW}px`, height: `${VIEW}px`, ...previewStyle }" role="img" aria-label="Photo preview" data-testid="photo-preview" />
      <label class="flex w-full items-center gap-3 text-[13px] text-ink-2">Zoom<input v-model.number="zoom" type="range" min="1" max="3" step="0.05" class="h-11 flex-1 accent-[var(--primary)]" data-testid="photo-zoom" /></label>
      <label class="flex w-full items-center gap-3 text-[13px] text-ink-2">Left–right<input v-model.number="x" type="range" min="-100" max="100" class="h-11 flex-1 accent-[var(--primary)]" /></label>
      <label class="flex w-full items-center gap-3 text-[13px] text-ink-2">Up–down<input v-model.number="y" type="range" min="-100" max="100" class="h-11 flex-1 accent-[var(--primary)]" /></label>
    </div>
    <p v-if="message" class="mt-2 text-[13px] text-destructive" role="status" data-testid="photo-message">{{ message }}</p>
    <div class="mt-3 flex gap-2">
      <Button type="button" class="min-h-11 md:min-h-9" :disabled="!img || account.busy" data-testid="photo-use" @click="use">{{ account.busy ? "Uploading…" : "Use photo" }}</Button>
      <Button type="button" variant="outline" class="min-h-11 md:min-h-9" @click="emit('close')">Cancel</Button>
    </div>
  </div>
</template>
