# Page: the player (mini player and player sheet)

- Where: the persistent mini player (every page) and the player sheet it opens. No route of its own.
- Phase: 4B (the whole-surah player), 4C (a single ayah, queues, clips). Phase 3 built play and pause.
- Prototype section: the player overlay (`d-ov` / `m-ov`, `playerHTML`) and the mini player strip.
- Offline level: none claimed. Streamed audio needs a connection unless it was downloaded (Downloads, Phase 11). The page's own controls, the saved place and the preferences work offline.
- Indexable: not a page.

## Purpose

Listen to a surah by a chosen reciter: seek, change speed, repeat, carry on to the next surah, come back to where you stopped, with lock-screen controls where the device has them.

## The mini player

- A fixed bar above the page content (`region` "Audio player"): a thin progress line, the surah's title and a status line, a Play/Pause button (44px), and **Try again** when the file failed. Tapping the title (a real button, "Open the player") opens the sheet.
- The status line reads: "Recited by <reciter>" while playing, **"Loading…"**, **"Buffering…"**, **"Paused at 12:34"** (also right after a reload when a saved place exists), or the error message. A polite live region announces it.
- It exists once something has been played, **and after a reload when a saved place exists, paused**: nothing plays until a tap.

## The sheet

A bottom sheet on a phone, a side panel on desktop (the same `Sheet` as the other pages). Escape closes it and focus returns to the mini player's title.

- **Header:** the surah and "Recited by <reciter>", a polite status line, **Try again** on an error, and (for a restored item) the **resume line**: "Resume where you stopped · Al-Kahf · 12:34", a button that plays from that place.
- **Position:** a real slider (`aria-label` "Position"; `aria-valuetext` "1 minute 20 seconds of 6 minutes"; step 1 s; changes the file's time when released or on a key; disabled until the file has said how long it is), with the time and the length.
- **Controls:** Previous surah, Back 10 seconds, Play/Pause (56px), Forward 10 seconds, Next surah. Previous (surah 1) and Next (surah 114) are real buttons with `aria-disabled`; the skips are inert until the length is known.
- **Speed:** 0.75, 1, 1.25, 1.5, 2 (`aria-pressed`). It writes the same value as Settings (`quran:audio-prefs:v1` `playbackRate`); a Settings value outside the five (0.5 to 3) shows as a selected custom chip "0.5× (set in Settings)".
- **Reciter:** the five reciters as chips, with "**Switching reciter restarts this surah.**" shown above them, before anything happens. A switch while playing plays the new reciter's file from 0; while paused it only changes what Play will play (never an autoplay). It also sets the preferred reciter, as the reader's menu does.
- **Repeat this recitation** (`repeatOne`) and **Play the next surah automatically** (the Settings value, `autoAdvance`): two switches.
- **Save audio to device:** a visible, real button with `aria-disabled` and "Saving audio arrives with Downloads". No offline claim anywhere.
- **Space** plays or pauses when focus is on the sheet or the slider; on a button, Space is that button's own action. There are no other single-key shortcuts. Nothing animates (so Reduce motion needs nothing extra).

## What plays, and what does not start by itself

Nothing ever starts on page load, after a reload, or when a resume record exists: `restore()` only shows the item. A surah starts from a Play press (listing row, reader, mini player, sheet, the resume line) or the lock screen's Play. **Play the next surah automatically** continues a surah the user started, only when the Settings switch is on, and stops after surah 114. A browser that refuses a `play()` shows "Tap Play to start."

## The saved place (new to users; the legacy never used its record)

`quran:audio-resume:v1` = `{ url, position, nowPlaying: { type, surahNo, title, subtitle, reciter } }`: the legacy shape, with `reciter` added. Written every 5 seconds while playing, when paused, when the page is hidden or closed, and reset to 0 when a surah finishes (a finished surah is not "where you stopped"). On the next visit the item is found again by **surah and reciter name**, never by the stored URL, and the file is moved to the saved place only after its metadata has arrived. A legacy record whose reciter is only in `subtitle` resumes with that reciter; a legacy ayah or name record is ignored. `quran:audio-prefs:v1` = `{ playbackRate, repeatOne, autoAdvance }`, written in full, other fields kept. Both shapes are tested against the **legacy composable's own code** (`tests/audioLegacy.test.ts`).

## Media Session

Where the browser has it: metadata (surah, reciter, album "Quran App"), the playback state, and the actions Play, Pause, Seek to, Back 10 s, Forward 10 s, Previous track and Next track (removed at surah 1 and 114); the lock-screen scrubber gets the position about once a second. Tested with a stub and, in Chromium, on the real `navigator.mediaSession` (metadata and state). Whether a phone's lock screen shows them is a device check.

## What can play (Phase 4C)

One thing plays at a time, through the one audio element and the one store. Starting anything replaces what was going.

| Kind | Started from | The file | Previous / Next | Repeat | Saved place |
| --- | --- | --- | --- | --- | --- |
| **Surah** | the listing, the reader's Play surah, the mini player | the full-surah file (as 4B) | previous / next surah | yes ("Repeat this recitation") | `quran:audio-resume:v1` (legacy shape, unchanged) |
| **Ayah** | the reader's **Play ayah N** | the url the per-ayah endpoint gives for that ayah and reciter | previous / next ayah of the same surah | yes ("Repeat this ayah") | none |
| **Queue** | **Play page** (Per page), **Listen to this chapter** (Stories) | one ayah's file at a time, in order | previous / next ayah in the queue | none (a queue plays through once) | `quran:audio-queue:v1` (new) |
| **Clip** | the Asma-ul-Husna name sheet | the name's own recording | none | none | none |

- **Titles:** the mini player and sheet show "Al-Baqara" (surah), "Al-Baqara 2:255" (ayah), "Page 49" or the chapter's title (queue), the name (clip). The line under it is "Recited by <reciter>", or for a queue "Al-Baqara 2:6 · ayah 3 of 13", or "Asma-ul-Husna" for a clip. Media Session: the title is the ayah's reference (or the surah or name), the artist the reciter, the album "Quran App" or the queue's title.
- **Highlight:** the ayah being recited (alone or in a queue) is highlighted where it is shown (the reader's row, the Per-page frame's text, the Stories chapter's ayah) with `aria-current="true"`. Nothing is highlighted while a whole surah plays.
- **Follow audio** (sheet, ayahs and queues only): "Keep the playing ayah in view", **off by default**, stored in the new additive key `quran:player-prefs:v1` (`{ followAyah }`); when on, the playing ayah is brought into view (instant, no focus change) only if it is not already fully visible and only when the ayah changes. **It is never on while Reduce motion is on** (the switch is off and disabled with a note).
- **A queue's advance:** the next ayah starts the moment one ends (no pause between files: the recordings carry their own silence, and a device check decides whether that is right); exactly **one ayah ahead** is fetched (not on a Save-Data connection), through the existing audio cache rule; it **stops after its last ayah** (it never carries on into another page or chapter) and its place goes back to the first ayah.
- **A failed ayah:** asked for once more automatically (the endpoint is asked again), then the queue **stops on it** with "Couldn’t play ayah 2:7. Audio needs a connection unless it was downloaded.", **Try again** and (in a queue) **Skip this ayah**. It is never skipped silently. A single ayah has Try again only.
- **The queue's saved place:** `quran:audio-queue:v1` = `{ v: 1, kind: "page" | "story", ref: { page } | { storyId, chapter }, index, reciter, position, savedAt }`. Written every 5 seconds while playing, on pause, on `pagehide`, reset to the first ayah at the end. The list of ayahs is never stored: it is rebuilt from the data on resume. After a reload the mini player shows the **last thing started**, paused: starting a surah removes the queue's record; starting a queue leaves the surah's record alone and the queue wins on restore. A record that cannot be rebuilt (a bad page, a gone story) is ignored and the surah's record is used. The legacy app ignores the new key.
- **Reciter switch:** a surah restarts from the beginning; an ayah plays again by the new reciter; a queue plays the current ayah again by the new reciter and carries on. The note above the chips says which, before it happens. A clip has no reciter.
- **No autoplay anywhere:** every kind starts only from a press. A queue moves on only because the user started it.
- **Offline:** unchanged claim: none. In a desktop Chromium test with the real service worker and real files, a small per-ayah file that was played or preloaded once played again offline (seeking unreliable for a preloaded one); not proven on iPhone, Android or Firefox, so the app says nothing about it.

## States

| State | What shows |
| --- | --- |
| Loading | "Loading…", Pause button, slider and skips inert |
| Playing | The position moves; "Recited by …" in the mini player, "Playing" in the sheet |
| Buffering | "Buffering…" (a state, not a spinner), Pause still works |
| Paused / restored | "Paused at 12:34", Play; the resume line in the sheet for a restored item |
| Could not play | "Couldn’t play. Audio needs a connection unless it was downloaded." and **Try again** (mini player and sheet) |
| Too slow to start | After 30 seconds without the file's length: "Taking too long to start. Check your connection and try again." and Try again |
| Refused by the browser | "Tap Play to start." |

## Tests

`tests/audioState.test.ts`, `tests/audioEngine.test.ts` (the state machine with a fake element and the Media Session), `tests/audioQueue.test.ts` (an ayah, a queue, a clip, 4C), `tests/audioLegacy.test.ts` (the legacy code beside this one), `tests/player.test.ts`, `e2e/player.spec.ts`, `e2e/ayahaudio.spec.ts` and `e2e/queue.spec.ts` (4C). See `docs/phases/phase-04b-player.md` and `docs/phases/phase-04c-ayah-audio.md`.
