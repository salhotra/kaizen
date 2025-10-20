import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecordButton } from './RecordButton';

const meta: Meta<typeof RecordButton> = {
  title: 'UI/RecordButton',
  component: RecordButton,
  decorators: [
    (Story: React.ComponentType): React.ReactElement => (
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '40px',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#1a1a1a' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isRecording: {
      control: 'boolean',
      description: 'Whether the button is in recording state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the record button',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback function when button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    isRecording: false,
    disabled: false,
  },
};

export const Recording: Story = {
  args: {
    isRecording: true,
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    isRecording: false,
    disabled: true,
  },
};

export const DisabledRecording: Story = {
  args: {
    isRecording: true,
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    isRecording: false,
    disabled: false,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    isRecording: false,
    disabled: false,
    size: 'md',
  },
};

