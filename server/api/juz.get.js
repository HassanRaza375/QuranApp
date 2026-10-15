export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { juzNo } = getQuery(event)

  const juz = Number(juzNo)
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) {
    throw createError({
      statusCode: 400,
      statusMessage: 'juzNo must be between 1 and 30'
    })
  }

  let response
  try {
    response = await $fetch(
      `${config.public.quranApiBase2}/juz/${juz}/quran-uthmani`
    )
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch Juz data'
    })
  }

  const ayahs = response?.data?.ayahs

  if (!Array.isArray(ayahs)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unexpected API response format'
    })
  }

  // Group ayahs by surah
  const groupedBySurah = {}

  for (const ayah of ayahs) {
    const surahName = ayah.surah.name

    if (!groupedBySurah[surahName]) {
      groupedBySurah[surahName] = {
        surah: ayah.surah,
        ayahs: []
      }
    }

    groupedBySurah[surahName].ayahs.push(ayah)
  }

  return {
    juz: response.data.number,
    surahs: groupedBySurah
  }
})
