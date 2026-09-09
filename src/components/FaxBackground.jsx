/**
 * A drift of fax sheets behind the content: scattered pages, a few of which
 * leaf over now and then.
 *
 * Colour is not set here: `currentColor` carries it, and the two themes assign
 * it in App.css off `:root[data-theme="dark"]`. The Vue original had to make
 * the same split because a `:global(.dark)` inside a scoped block is dropped by
 * the SFC compiler; here there is no scoped CSS, but keeping the colour in one
 * plain rule beats threading two more props through the component.
 */

/** One sheet, in A4 proportion. */
const W = 64
const H = 84
/** The turned-down corner. Nothing else says "paper" as cheaply. */
const FOLD = 14

/** A tile big enough that the scatter inside it does not read as a repeat. */
const TILE_W = 560
const TILE_H = 460

/**
 * The scatter. Placed and angled by hand — a random spread clumps, and clumped
 * sheets at this size read as a blot rather than as paper.
 */
const sheets = [
  { x: 40, y: 30, r: -8 },
  { x: 250, y: 96, r: 6 },
  { x: 430, y: 18, r: -3 },
  { x: 130, y: 232, r: 11 },
  { x: 344, y: 300, r: -14 },
  { x: 496, y: 224, r: 4 },
  { x: 18, y: 378, r: 7 },
]

/**
 * A sheet is far bigger than the gap to the tile edge, so most of them straddle
 * one. A rectangular tile only repeats seamlessly if what hangs over an edge is
 * drawn again on the opposite one, so every sheet is emitted nine times, once
 * per neighbouring tile, and the pattern clips away the eight that miss.
 */
const NEIGHBOURS = [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => [i, j]))

const tileSheets = sheets.flatMap((s) =>
  NEIGHBOURS.map(([i, j]) => ({ ...s, x: s.x + i * TILE_W, y: s.y + j * TILE_H })),
)

/**
 * The sheets that leaf. Each one is a lattice coordinate rather than a free
 * position, so the turning page lands exactly on a sheet the pattern already
 * drew instead of beside it.
 */
const leaves = [
  [0, 0, 0],
  [3, 1, 0],
  [1, 2, 1],
  [5, 0, 1],
  [2, 2, 2],
  [6, 1, 2],
  [4, 3, 0],
  [0, 3, 2],
].map(([index, i, j], n) => ({
  ...sheets[index],
  x: sheets[index].x + i * TILE_W,
  y: sheets[index].y + j * TILE_H,
  delay: n * 3.4,
}))

/** Outline with the top-right corner turned down. */
const OUTLINE = `M0,0 H${W - FOLD} L${W},${FOLD} V${H} H0 Z`
/** The underside of that corner. */
const FOLD_PATH = `M${W - FOLD},0 V${FOLD} H${W}`

function Sheet() {
  return (
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <path d={OUTLINE} fill="currentColor" fillOpacity="0.07" />
      <path d={FOLD_PATH} strokeOpacity="0.6" />
      {/* Two strokes of "text". More turns the sheet back into a line raster. */}
      <path d={`M12,36 H${W - 16}`} strokeOpacity="0.45" />
      <path d={`M12,50 H${W - 26}`} strokeOpacity="0.45" />
    </g>
  )
}

export function FaxBackground({ hero = false }) {
  return (
    <div
      className={`fax-bg${hero ? ' fax-bg--hero' : ''}`}
      aria-hidden="true"
      style={{ '--fax-bg-tile-h': `${TILE_H}px` }}
    >
      <svg className="fax-bg__field" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <g id="fax-sheet">
            <Sheet />
          </g>

          <pattern id="fax-sheets" width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            {tileSheets.map((s, i) => (
              <use
                key={i}
                href="#fax-sheet"
                transform={`translate(${s.x} ${s.y}) rotate(${s.r} ${W / 2} ${H / 2})`}
              />
            ))}
          </pattern>
        </defs>

        {/*
          The field is faded here rather than on the container, so the sheets
          that leaf can be brighter than it without the container's opacity
          flattening them back into the drift.

          The gate is a single card on an otherwise empty screen and carries the
          field at full strength. The editor is already a sheet of paper under a
          toolbar, and the same strength reads as clutter behind it — so that
          gets roughly half.
        */}
        <rect className="fax-bg__field-fill" width="100%" height="100%" fill="url(#fax-sheets)" />

        {leaves.map((s, i) => (
          // The placement is an attribute and the turn is a CSS transform, so
          // they cannot share an element: a CSS transform would replace the
          // attribute outright and the page would leaf at the origin.
          <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.r} ${W / 2} ${H / 2})`}>
            <g className="fax-bg__leaf" style={{ animationDelay: `${s.delay}s` }}>
              <use href="#fax-sheet" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
