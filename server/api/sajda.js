export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  let response;
  try {
    response = await $fetch(
      `${config.public.quranApiBase2}/sajda/quran-uthmani`,
    );
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch Sajda data",
    });
  }
  return response;
});
