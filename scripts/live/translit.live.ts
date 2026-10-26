// Checks the REAL transliteration answer still has the shape the service reads (api.alquran.cloud, edition en.transliteration). By hand, not in CI.
import { describe, expect, it } from "vitest";

describe("real transliteration", () => {
  it("answers { data: { text } } for a dua's ayah", async () => {
    for (const ref of ["2:127", "7:23", "21:87", "2:286"]) {
      const r = await fetch(`https://api.alquran.cloud/v1/ayah/${ref}/en.transliteration`);
      expect(r.status, ref).toBe(200);
      const body = (await r.json()) as { data?: { text?: string } };
      expect(typeof body.data?.text, ref).toBe("string");
      expect(body.data!.text!.length, ref).toBeGreaterThan(5);
    }
  });
});
