/**
 * Felipe's own photography and film, for the day there is material to show.
 *
 * OFF by default, and nothing reads it while `enabled` is false: there is no
 * gallery, reel or photography section on the site, and no stock image may
 * stand in for his work. To turn it on, add real files under
 * public/assets/media/, list them here and set `enabled: true`; the story's
 * "hoje" chapter is the planned place for one photo or the reel, since
 * photography is part of who he is, not a destination of the journey.
 */
export type PersonalPhoto = { src: string; srcSet?: string; width: number; height: number; alt: { pt: string; en: string } };

export type PersonalMedia = {
  enabled: boolean;
  photos: readonly PersonalPhoto[];
  /** A short reel: same shape as a project video (see data/work.ts). */
  reel: { poster: string; mp4: string; webm?: string } | null;
};

export const PERSONAL_MEDIA: PersonalMedia = {
  enabled: false,
  photos: [],
  reel: null,
};
