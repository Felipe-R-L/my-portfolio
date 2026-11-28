import { describe, it, expect } from "vitest";
import { GALLERY, PHOTOS, columnsOf } from "../../src/app/data/gallery";

describe("gallery", () => {
  it("puts every item in exactly one column, in order within each", () => {
    for (const n of [1, 2, 3]) {
      const cols = columnsOf(GALLERY, n);
      expect(cols).toHaveLength(n);
      expect(cols.flat().sort((a, b) => a - b)).toEqual(GALLERY.map((_, i) => i));
      for (const c of cols) expect([...c].sort((a, b) => a - b)).toEqual(c);
    }
  });

  it("keeps the columns close in height", () => {
    const cols = columnsOf(GALLERY, 3);
    const h = cols.map((c) => c.reduce((s, i) => s + 1 / GALLERY[i].ratio, 0));
    // never more than one tall frame apart
    expect(Math.max(...h) - Math.min(...h)).toBeLessThan(16 / 9 + 0.5);
  });

  it("pages the lightbox through the photos only", () => {
    expect(PHOTOS.every((p) => !p.video)).toBe(true);
    expect(PHOTOS.length).toBe(GALLERY.length - 1);
  });

  it("never invents a place", () => {
    // the Samsung files carry no GPS; only the cathedral's town came from Felipe
    const placed = GALLERY.filter((g) => g.place).map((g) => g.key);
    expect(placed).toEqual(["img-1598", "img-1889", "img-1591", "20231026-133039", "img-4310", "img-1827"]);
  });
});
