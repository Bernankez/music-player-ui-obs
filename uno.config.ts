import type { CSSEntries } from "unocss";
import { defineConfig, presetIcons, presetWind3, transformerDirectives } from "unocss";
import presetAnimations from "unocss-preset-animations";
import presetShadcn from "unocss-preset-shadcn";

export const directionMap: Record<string, string[]> = {
  "l": ["-left"],
  "r": ["-right"],
  "t": ["-top"],
  "b": ["-bottom"],
  "s": ["-inline-start"],
  "e": ["-inline-end"],
  "tr": ["-top", "-right"],
  "rt": ["-top", "-right"],
  "tl": ["-top", "-left"],
  "lt": ["-top", "-left"],
  "br": ["-bottom", "-right"],
  "rb": ["-bottom", "-right"],
  "bl": ["-bottom", "-left"],
  "lb": ["-bottom", "-left"],
  "x": ["-left", "-right"],
  "y": ["-top", "-bottom"],
  "": [""],
  "bs": ["-block-start"],
  "be": ["-block-end"],
  "is": ["-inline-start"],
  "ie": ["-inline-end"],
  "block": ["-block-start", "-block-end"],
  "inline": ["-inline-start", "-inline-end"],
};

export default defineConfig({
  presets: [
    presetWind3(),
    presetAnimations(),
    presetShadcn({
      color: "neutral",
      radius: 0.75,
    }),
    presetIcons(),
  ],
  transformers: [transformerDirectives()],
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        "(components|src)/**/*.{js,ts}",
      ],
    },
  },
  rules: [
    [/^text-rate(?:-?(.+))?$/, ([, r]) => ({ [`font-size`]: `calc(var(--base-font-size) * ${r})` })],
    [/^leading-rate(?:-?(.+))?$/, ([, r]) => ({ [`line-height`]: `calc(var(--base-font-size) * ${r})` })],
    [/^w-rate(?:-?(.+))?$/, ([, r]) => ({ [`width`]: `calc(var(--base-font-size) * ${r})` })],
    [/^h-rate(?:-?(.+))?$/, ([, r]) => ({ [`height`]: `calc(var(--base-font-size) * ${r})` })],
    // padding
    [/^p-rate(?:-?(.+))?$/, ([, r]) => ({ [`padding`]: `calc(var(--base-font-size) * ${r})` })],
    [/^p([xy])-rate(?:-?(.+))?$/, handlerPadding],
    [/^p([rltbse])-rate(?:-?(.+))?$/, handlerPadding],
    [/^p([rltb]{2})-rate(?:-?(.+))?$/, handlerPadding],
    [/^p([bise][se])-rate(?:-?(.+))?$/, handlerPadding],
    [/^p(block|inline)-rate(?:-?(.+))?$/, handlerPadding],
    // margin
    [/^m-rate(?:-?(.+))?$/, ([, r]) => ({ [`margin`]: `calc(var(--base-font-size) * ${r})` })],
    [/^m([xy])-rate(?:-?(.+))?$/, handlerMargin],
    [/^m([rltbse])-rate(?:-?(.+))?$/, handlerMargin],
    [/^m([rltb]{2})-rate(?:-?(.+))?$/, handlerMargin],
    [/^m([bise][se])-rate(?:-?(.+))?$/, handlerMargin],
    [/^m(block|inline)-rate(?:-?(.+))?$/, handlerMargin],
    // gap
    [/^gap-rate(?:-?(.+))?$/, ([, r]) => ({ [`gap`]: `calc(var(--base-font-size) * ${r})` })],
    [/^gap-([xy])-rate(?:-?(.+))?$/, ([, d, r]) => {
      const property = d === "x" ? "column-gap" : "row-gap";
      return { [property]: `calc(var(--base-font-size) * ${r})` };
    }],
    // radius
    // eslint-disable-next-line regexp/no-empty-capturing-group, regexp/no-empty-group
    [/^(?:border-|b-)?(?:rounded|rd)()-rate(?:-(.+))?$/, handlerRounded],
    [/^(?:border-|b-)?(?:rounded|rd)-([rltbse])-rate(?:-(.+))?$/, handlerRounded],
    [/^(?:border-|b-)?(?:rounded|rd)-([rltb]{2})-rate(?:-(.+))?$/, handlerRounded],
    [/^(?:border-|b-)?(?:rounded|rd)-([bise][se])-rate(?:-(.+))?$/, handlerRounded],
    [/^(?:border-|b-)?(?:rounded|rd)-([bi][se]-[bi][se])-rate(?:-(.+))?$/, handlerRounded],
  ],
});

// eslint-disable-next-line unused-imports/no-unused-vars
function directionSize(size?: string) {
  if (!size) {
    return "0rem";
  }
  const _size = Number(size);
  if (Number.isNaN(_size)) {
    // eslint-disable-next-line regexp/no-useless-escape
    return size.replaceAll(/[\[\]]/g, "").replaceAll("_", " ");
  }
  return `${_size / 4}rem`;
}

function handlerPadding([, a = "", r = "DEFAULT"]: string[]): CSSEntries | undefined {
  if (a in directionMap) {
    return directionMap[a].map(i => [`padding${i}`, `calc(var(--base-font-size) * ${r})`]);
  }
}

function handlerMargin([, a = "", r = "DEFAULT"]: string[]): CSSEntries | undefined {
  if (a in directionMap) {
    return directionMap[a].map(i => [`margin${i}`, `calc(var(--base-font-size) * ${r})`]);
  }
}

function handlerRounded([, a = "", s = "DEFAULT"]: string[]): CSSEntries | undefined {
  if (a in directionMap) {
    if (s === "full")
      return directionMap[a].map(i => [`border${i}-radius`, "calc(infinity * 1px)"]);

    return directionMap[a].map(i => [`border${i}-radius`, `calc(var(--base-font-size) * ${s})`]);
  }
}
