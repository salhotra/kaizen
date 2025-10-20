import { motion } from 'framer-motion';
import { css } from '../../../styled-system/css';

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
      className={css({
        width: `${outerSize}px`,
        height: `${outerSize}px`,
        padding: 0,
        border: `${ringWidth}px solid white`,
        borderRadius: '50%',
        backgroundColor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      })}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <motion.div
        className={css({
          backgroundColor: 'record',
        })}
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

