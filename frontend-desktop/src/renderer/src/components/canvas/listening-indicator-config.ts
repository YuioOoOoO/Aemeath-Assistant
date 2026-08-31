export const LISTENING_INDICATOR_CONFIG = {
  enabled: true,
  animationEnabled: true,

  // Anchor within the model's current visible drawable bounds.
  anchorXRatio: 0.79,
  anchorYRatio: 0.85,

  // Offsets are relative to the model's visible screen size.
  horizontalOffsetRatio: 0.13,
  verticalOffsetRatio: -0.055,

  // The icon scales with the model, while staying legible at small sizes.
  widthRatio: 0.18,
  minWidthPx: 36,
  maxWidthPx: 104,
  scale: 1,
  aspectRatio: 96 / 110,

  // Position sampling runs only while the indicator is visible.
  positionFps: 30,
} as const;
