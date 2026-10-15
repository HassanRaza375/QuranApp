export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  let response;
  try {
    response = await $fetch(`${config.public.quranApiBase}/surah.json`);
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch Surah data",
    });
  }
  return response;
});
