// 4-day upper/lower. Every muscle twice a week, which the old 6-day rotation
// could not do at 3 sessions a week. First item on each upper day is prehab —
// it lives inside the workout so it stops being the thing that gets skipped.
//
// Delts and the prehab work progress by reps, not load: wide ranges, and the
// weight only moves once the top of the range holds on every set. Two years of
// shoulder trouble is reason enough to buy the stimulus with reps.
//
// Vertical pulling twice a week: the pulldown on A, pull-ups on B. Both climb
// by reps - no weighted pull-ups, because going 0 to 10 reps in two years is a
// lift that is already progressing and does not need fixing.
//
// Nothing on the lower days runs below 8 reps. Hypertrophy is equivalent from
// roughly 5 to 30 reps when the set is taken near failure, so a 6-8 leg press
// buys maximal strength expression and nothing else - and it buys it at the
// cost of a day he will skip. The hinge is a hip thrust rather than a Romanian
// deadlift: same hip extension, no spinal loading, nothing to learn.
//
// The pulldown sits second, before any other back work. It has been stalled
// for two years, and for two years it has also been run late in the session.
// Nobody has ever tested it fresh. That is the experiment, and the row pays
// for it by dropping one slot.
export const DAY_TEMPLATES = [
  {
    key: 'upper_a',
    label: 'Upper A – Heavy',
    items: [
      { name: 'Face Pulls', sets: 2, reps: '20–25' },
      { name: 'Lat Pulldown', sets: 3, reps: '8–10' },
      { name: 'Smith Flat Press', sets: 3, reps: '6–8' },
      { name: 'Machine Row', sets: 3, reps: '6–8' },
      { name: 'Incline DB Bench (neutral grip)', sets: 2, reps: '10–12' },
      { name: 'Lateral Raises (strict, light)', sets: 3, reps: '15–20' },
      { name: 'Incline DB Curls', sets: 2, reps: '10–12' },
      { name: 'Cable Rope Pushdowns', sets: 2, reps: '10–12' },
    ],
  },
  {
    key: 'lower_a',
    label: 'Lower A – Press & Hinge',
    items: [
      { name: 'Leg Press', sets: 3, reps: '8–12' },
      { name: 'Hip Thrust', sets: 3, reps: '10–12' },
      { name: 'Split Squats', sets: 2, reps: '10–12' },
      { name: 'Hamstring Curls', sets: 2, reps: '10–12' },
      { name: 'Standing Calf Raises', sets: 3, reps: '12–15' },
      { name: 'Suitcase Carry', sets: 2, reps: '40 steps' },
    ],
  },
  {
    key: 'upper_b',
    label: 'Upper B – Volume',
    items: [
      { name: 'Cable External Rotations', sets: 2, reps: '15' },
      { name: 'Cable Chest Press (low→mid angle)', sets: 3, reps: '10–12' },
      { name: 'Pull-Ups (bodyweight)', sets: 4, reps: '6–12' },
      { name: 'Chest-Supported DB Row (1-arm)', sets: 3, reps: '10–12' },
      { name: 'DB Neutral-Grip High-Incline Press (~60°)', sets: 2, reps: '10–12' },
      { name: 'Cable Y-Raise', sets: 2, reps: '15–20' },
      { name: 'Dips', sets: 2, reps: '8–12' },
      { name: 'Hammer Curls', sets: 2, reps: '12–15' },
    ],
  },
  {
    key: 'lower_b',
    label: 'Lower B – Volume',
    items: [
      { name: 'Leg Extensions', sets: 3, reps: '12–15' },
      { name: 'Leg Press', sets: 3, reps: '12–15' },
      { name: 'Hamstring Curls', sets: 3, reps: '8–10' },
      { name: 'Walking Lunges', sets: 2, reps: '12–15' },
      { name: 'Seated Calf Raises', sets: 3, reps: '15–20' },
      { name: 'Plank', sets: 2, reps: '45–60s' },
    ],
  },
]
