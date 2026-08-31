/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useEffect, useRef } from 'react';
import { AiStateEnum, useAiState } from '@/context/ai-state-context';
import { useVAD } from '@/context/vad-context';
import { LAppDelegate } from '../../../WebSDK/src/lappdelegate';
import { LISTENING_INDICATOR_CONFIG as config } from './listening-indicator-config';
import './listening-indicator.css';

interface DrawableBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const getDrawableBounds = (coreModel: any): DrawableBounds | null => {
  if (!coreModel) return null;

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const drawableCount = coreModel.getDrawableCount?.() ?? 0;
  for (let drawableIndex = 0; drawableIndex < drawableCount; drawableIndex += 1) {
    if ((coreModel.getDrawableOpacity?.(drawableIndex) ?? 1) <= 0.01) continue;
    const vertices = coreModel.getDrawableVertices?.(drawableIndex) as Float32Array | undefined;
    if (!vertices) continue;

    for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex += 2) {
      const x = vertices[vertexIndex];
      const y = vertices[vertexIndex + 1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  if (![minX, maxX, minY, maxY].every(Number.isFinite)) return null;
  return { minX, maxX, minY, maxY };
};

const ListeningIndicator = memo(({ canvas }: { canvas: HTMLCanvasElement | null }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { micOn, isVadRunning } = useVAD();
  const { aiState } = useAiState();

  const shouldShow = config.enabled
    && micOn
    && isVadRunning
    && aiState === AiStateEnum.LISTENING;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !canvas || !shouldShow) return undefined;

    let animationFrameId = 0;
    let lastUpdateAt = 0;
    let cachedModel: any = null;
    let cachedBounds: DrawableBounds | null = null;
    const minimumFrameTime = 1000 / config.positionFps;

    const updatePosition = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(updatePosition);
      if (timestamp - lastUpdateAt < minimumFrameTime) return;
      lastUpdateAt = timestamp;

      const adapter = (window as any).getLAppAdapter?.();
      const live2dModel = adapter?.getModel?.();
      const coreModel = live2dModel?.getModel?.();
      const modelMatrix = live2dModel?._modelMatrix;
      const view = LAppDelegate.getInstance().getView();
      if (!coreModel || !modelMatrix || !view || canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
        return;
      }

      if (cachedModel !== coreModel || !cachedBounds) {
        cachedModel = coreModel;
        cachedBounds = getDrawableBounds(coreModel);
      }
      if (!cachedBounds) return;

      const modelWidth = cachedBounds.maxX - cachedBounds.minX;
      const modelHeight = cachedBounds.maxY - cachedBounds.minY;
      const anchorX = cachedBounds.minX + modelWidth * config.anchorXRatio;
      const anchorY = cachedBounds.minY + modelHeight * config.anchorYRatio;

      const toCssPoint = (modelX: number, modelY: number) => {
        let projectedX = view._viewMatrix.transformX(modelMatrix.transformX(modelX));
        let projectedY = view._viewMatrix.transformY(modelMatrix.transformY(modelY));

        if (coreModel.getCanvasWidth() > 1 && canvas.width < canvas.height) {
          projectedY *= canvas.width / canvas.height;
        } else {
          projectedX *= canvas.height / canvas.width;
        }

        return {
          x: ((projectedX + 1) * canvas.clientWidth) / 2,
          y: ((1 - projectedY) * canvas.clientHeight) / 2,
        };
      };

      const anchor = toCssPoint(anchorX, anchorY);
      const leftEdge = toCssPoint(cachedBounds.minX, anchorY);
      const rightEdge = toCssPoint(cachedBounds.maxX, anchorY);
      const bottomEdge = toCssPoint(anchorX, cachedBounds.minY);
      const topEdge = toCssPoint(anchorX, cachedBounds.maxY);
      const visibleWidth = Math.abs(rightEdge.x - leftEdge.x);
      const visibleHeight = Math.abs(bottomEdge.y - topEdge.y);

      const iconWidth = Math.max(
        config.minWidthPx,
        Math.min(config.maxWidthPx, visibleWidth * config.widthRatio * config.scale),
      );
      const x = anchor.x + visibleWidth * config.horizontalOffsetRatio - iconWidth / 2;
      const y = anchor.y + visibleHeight * config.verticalOffsetRatio - iconWidth * config.aspectRatio / 2;

      element.style.width = `${iconWidth}px`;
      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, [canvas, shouldShow]);

  return (
    <div
      ref={elementRef}
      className="listening-indicator"
      data-visible={shouldShow ? 'true' : 'false'}
      data-animated={config.animationEnabled ? 'true' : 'false'}
      aria-hidden="true"
    >
      <svg
        className="listening-indicator__svg"
        viewBox="-10 0 110 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ background: 'transparent' }}
      >
        <defs>
          <linearGradient id="listening-ear-fill" x1="28" y1="10" x2="63" y2="67" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFDFE" />
            <stop offset="0.58" stopColor="#FFF8FB" />
            <stop offset="1" stopColor="#FBEAF2" />
          </linearGradient>
          <linearGradient id="listening-ear-pink" x1="22" y1="42" x2="40" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD6E5" />
            <stop offset="1" stopColor="#F3A9C8" />
          </linearGradient>
          <linearGradient id="listening-star-gold" x1="49" y1="69" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF4B7" />
            <stop offset="0.55" stopColor="#F8D276" />
            <stop offset="1" stopColor="#DCA94C" />
          </linearGradient>
        </defs>

        <g className="listening-indicator__ear">
          <path
            d="M24.8 51.3C20.6 44.7 21.9 35.3 29.3 29.6L57.2 8.5C63.2 3.9 70.7 7.7 70.4 15.5C70.2 22.4 66.1 29.1 59.8 33.8C65.4 31.3 71.1 34.7 70.4 40.8C69.8 46.7 64.3 51.8 57.4 54.1C62.6 54.1 65.3 58.9 62.5 63.1C58.7 68.7 48.4 69.1 38.6 64.3C31.8 61 27.1 56.7 24.8 51.3Z"
            fill="url(#listening-ear-fill)"
            stroke="#FFFDFE"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d="M58.9 33.9C54.1 38.4 48.7 41.4 42.1 43.1"
            stroke="#EFCBD9"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M57 54.2C51.1 56.7 45.2 57.1 39.7 55.4"
            stroke="#EFCBD9"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M20.8 53.2C20.8 44.1 27.3 38.5 35.1 39.3C43.2 40.1 47.6 47.3 45.1 55.1C42.8 62.2 35.9 66 28.8 63.4C23.8 61.6 20.8 57.8 20.8 53.2Z"
            fill="#FFF9FC"
            stroke="#FFFDFE"
            strokeWidth="3.3"
          />
          <ellipse
            cx="31.6"
            cy="52.2"
            rx="7.1"
            ry="7"
            fill="url(#listening-ear-pink)"
            stroke="#FFF7FB"
            strokeWidth="1.7"
          />
        </g>

        <g
          className="listening-indicator__wave listening-indicator__wave--near"
          stroke="#F18DB8"
          strokeWidth="4.1"
          strokeLinecap="round"
        >
          <path d="M17.6 21.5C10.9 28.1 8.2 37.4 10.2 46.1" />
          <path d="M77.5 43.1C79.5 51.5 76.9 60.7 70.9 66.7" />
        </g>
        <g
          className="listening-indicator__wave listening-indicator__wave--far"
          stroke="#EB76AA"
          strokeWidth="4.1"
          strokeLinecap="round"
        >
          <path d="M8.7 13.7C-1.8 23.8 -5.8 38.7 -2.1 52.7" />
          <path d="M89 40.8C92.6 53.5 88.4 67.6 79.6 76.2" />
        </g>

        <path
          className="listening-indicator__star"
          d="M58.8 70.3C60.1 76.8 63 79.7 69.5 81C63 82.3 60.1 85.2 58.8 91.7C57.5 85.2 54.6 82.3 48.1 81C54.6 79.7 57.5 76.8 58.8 70.3Z"
          fill="url(#listening-star-gold)"
          stroke="#FFF9DF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

ListeningIndicator.displayName = 'ListeningIndicator';

export default ListeningIndicator;
