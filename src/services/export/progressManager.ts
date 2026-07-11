/**
 * Export Progress Manager helper.
 * Manages transition between various export statuses and updates percentages.
 */

export type ExportProgressStep =
  | 'preparing'
  | 'collecting'
  | 'loading_images'
  | 'generating_book'
  | 'compressing'
  | 'finalizing'
  | 'ready';

export interface ProgressState {
  status: ExportProgressStep;
  message: string;
  percent: number;
}

export const EXPORT_STEPS: Record<ExportProgressStep, { message: string; minPercent: number }> = {
  preparing: { message: 'Preparing Story...', minPercent: 5 },
  collecting: { message: 'Loading Memories...', minPercent: 15 },
  loading_images: { message: 'Loading Images...', minPercent: 30 },
  generating_book: { message: 'Generating Pages...', minPercent: 50 },
  compressing: { message: 'Compressing...', minPercent: 75 },
  finalizing: { message: 'Finalizing...', minPercent: 90 },
  ready: { message: 'Almost Ready ❤️', minPercent: 100 },
};

/**
 * Returns the human-readable message and estimated percentage for any export step.
 */
export function getProgressForStep(step: ExportProgressStep, subPercent: number = 0): ProgressState {
  const stepInfo = EXPORT_STEPS[step];
  const nextStepKey = getNextStepKey(step);
  const nextStepInfo = nextStepKey ? EXPORT_STEPS[nextStepKey] : { minPercent: 100 };
  
  const range = nextStepInfo.minPercent - stepInfo.minPercent;
  const calculatedPercent = Math.min(
    stepInfo.minPercent + Math.floor((subPercent / 100) * range),
    nextStepInfo.minPercent - 1
  );

  return {
    status: step,
    message: stepInfo.message,
    percent: step === 'ready' ? 100 : calculatedPercent,
  };
}

function getNextStepKey(step: ExportProgressStep): ExportProgressStep | null {
  const keys: ExportProgressStep[] = [
    'preparing',
    'collecting',
    'loading_images',
    'generating_book',
    'compressing',
    'finalizing',
    'ready',
  ];
  const idx = keys.indexOf(step);
  if (idx !== -1 && idx < keys.length - 1) {
    return keys[idx + 1];
  }
  return null;
}
