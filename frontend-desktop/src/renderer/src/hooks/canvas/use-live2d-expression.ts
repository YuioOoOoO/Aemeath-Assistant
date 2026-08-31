import { useCallback } from 'react';
import { ModelInfo } from '@/context/live2d-config-context';

/**
 * Custom hook for handling Live2D model expressions
 */
export const useLive2DExpression = () => {
  /**
   * Set expression for Live2D model
   * @param expressionValue - Expression name (string) or index (number)
   * @param lappAdapter - LAppAdapter instance
   * @param logMessage - Optional message to log on success
   */
  const setExpression = useCallback((
    expressionValue: string | number,
    lappAdapter: any,
    logMessage?: string,
  ) => {
    try {
      if (typeof expressionValue === 'string') {
        // Set expression by name
        lappAdapter.setExpression(expressionValue);
      } else if (typeof expressionValue === 'number') {
        // Set expression by index
        const expressionName = lappAdapter.getExpressionName(expressionValue);
        if (expressionName) {
          lappAdapter.setExpression(expressionName);
        }
      }
      if (logMessage) {
        console.log(logMessage);
      }
    } catch (error) {
      console.error('Failed to set expression:', error);
    }
  }, []);

  /**
   * Reset expression to default
   * @param lappAdapter - LAppAdapter instance
   * @param modelInfo - Current model information
   */
  const resetExpression = useCallback((
    lappAdapter: any,
    _modelInfo?: ModelInfo,
  ) => {
    if (!lappAdapter) return;

    try {
      // Check if model is loaded and has expressions
      const model = lappAdapter.getModel();
      if (!model || !model._modelSetting) {
        console.log('Model or model settings not loaded yet, skipping expression reset');
        return;
      }

      // An expression file is not a neutral pose. Stop the active expression
      // so Cubism returns to the face authored in the model itself.
      lappAdapter.resetExpression();
    } catch (error) {
      console.log('Failed to reset expression:', error);
    }
  }, []);

  return {
    setExpression,
    resetExpression,
  };
};
