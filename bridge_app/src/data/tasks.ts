import { Mood, Task } from '../types';

export const TASKS: Record<Mood, Task[]> = {
  anxious: [
    {
      id: 'anxious-1',
      mood: 'anxious',
      title: 'Box Breathing',
      description:
        'Inhale through your nose for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat slowly until the timer ends.',
      duration: 90,
    },
    {
      id: 'anxious-2',
      mood: 'anxious',
      title: '5-4-3-2-1 Grounding',
      description:
        'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.',
      duration: 90,
    },
    {
      id: 'anxious-3',
      mood: 'anxious',
      title: 'Cold Water Reset',
      description:
        'Splash cold water on your face or hold something cold in your hands. Let your nervous system downshift.',
      duration: 90,
    },
  ],
  stuck: [
    {
      id: 'stuck-1',
      mood: 'stuck',
      title: 'Write One Sentence',
      description:
        "Open a blank doc and write exactly one sentence about whatever you're stuck on. Just one — don't edit it.",
      duration: 90,
    },
    {
      id: 'stuck-2',
      mood: 'stuck',
      title: 'Brain Dump',
      description:
        "Grab paper and write every thought in your head right now. Don't filter — just empty the mental buffer.",
      duration: 90,
    },
    {
      id: 'stuck-3',
      mood: 'stuck',
      title: 'Change the Scene',
      description:
        'Stand up and walk to a different room. Stay there for 90 seconds, then return with fresh eyes.',
      duration: 90,
    },
  ],
  overwhelmed: [
    {
      id: 'overwhelmed-1',
      mood: 'overwhelmed',
      title: 'Name Three Controllables',
      description:
        'Say out loud or write three things that are actually within your control right now. Just three.',
      duration: 90,
    },
    {
      id: 'overwhelmed-2',
      mood: 'overwhelmed',
      title: 'Smallest Possible Step',
      description:
        'Pick the one task on your list that takes under 2 minutes. Do only that. Everything else waits.',
      duration: 90,
    },
    {
      id: 'overwhelmed-3',
      mood: 'overwhelmed',
      title: 'Progressive Muscle Release',
      description:
        'Tense and release each muscle group from toes to shoulders. Hold each for 5 seconds, then let go.',
      duration: 90,
    },
  ],
  'low-energy': [
    {
      id: 'low-energy-1',
      mood: 'low-energy',
      title: 'Sunlight & Stretch',
      description:
        'Stand near a window. Reach arms overhead, roll your neck slowly, and take five deep belly breaths.',
      duration: 90,
    },
    {
      id: 'low-energy-2',
      mood: 'low-energy',
      title: 'Glass of Water',
      description:
        'Drink a full glass of water slowly and deliberately. A simple act of self-care can break the inertia.',
      duration: 90,
    },
    {
      id: 'low-energy-3',
      mood: 'low-energy',
      title: 'Energising Breath',
      description:
        'Take 10 sharp inhales through the nose followed by one long, slow exhale through the mouth. Repeat twice.',
      duration: 90,
    },
  ],
  avoidant: [
    {
      id: 'avoidant-1',
      mood: 'avoidant',
      title: 'Two-Minute Rule',
      description:
        "If the thing you're avoiding takes less than 2 minutes, do it right now. Not after this — now.",
      duration: 90,
    },
    {
      id: 'avoidant-2',
      mood: 'avoidant',
      title: 'Name the Fear',
      description:
        "Write one sentence: \"I'm avoiding this because ___.\". Just naming the real reason often dissolves the block.",
      duration: 90,
    },
    {
      id: 'avoidant-3',
      mood: 'avoidant',
      title: 'Tiny Commitment',
      description:
        "Tell yourself you'll work on the avoided task for exactly 90 seconds. Set this timer, then start.",
      duration: 90,
    },
  ],
};
