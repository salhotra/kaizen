import { motion } from 'framer-motion';

const SIZES = {
  sm: 24,
  md: 40,
};

const RING_WIDTHS = {
  sm: 1,
  md: 1,
};

const GAP_SIZES = {
  sm: 3,
  md: 4,
};

interface RecordButtonProps {
  isRecording: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function RecordButton({
  isRecording,
  onClick,
  disabled,
  size = 'md',
}: RecordButtonProps): React.ReactElement {
  const outerSize = SIZES[size];
  const ringWidth = RING_WIDTHS[size];
  const gapSize = GAP_SIZES[size];
  const innerSize = outerSize - ringWidth * 2 - gapSize * 2;
  const squareSize = innerSize / Math.sqrt(2);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-0 border-white bg-transparent rounded-full flex items-center justify-center transition-opacity duration-200 ease-in-out"
      style={{
        width: `${outerSize}px`,
        height: `${outerSize}px`,
        borderWidth: `${ringWidth}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <motion.div
        className="bg-red-600"
        animate={{
          width: isRecording ? `${squareSize}px` : `${innerSize}px`,
          height: isRecording ? `${squareSize}px` : `${innerSize}px`,
          borderRadius: isRecording ? '4px' : '50%',
        }}
        transition={{
          duration: 0.6,
          ease: [0.2, 1, 0.2, 1],
        }}
      />
    </motion.button>
  );
}
