export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const { chapterNo } = getQuery(event);

  if (!chapterNo) {
    throw createError({
      statusCode: 400,
      statusMessage: "chapterNo is required",
    });
  }
  let response;
  try {
    response = await $fetch(`${config.public.quranApiBase}/${chapterNo}.json`);
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch Chapter data",
    });
  }
  return response;
});
