// 4-day upper/lower. Every muscle twice a week, which the old 6-day rotation
// could not do at 3 sessions a week. First item on each upper day is prehab —
// it lives inside the workout so it stops being the thing that gets skipped.
//
// Delts and the prehab work progress by reps, not load: wide ranges, and the
// weight only moves once the top of the range holds on every set. Two years of
// shoulder trouble is reason enough to buy the stimulus with reps.
//
// Vertical pulling is pull-ups on both upper days - weighted and heavy on A,
// bodyweight for volume on B. The lat pulldown is gone. It was stalled for two
// years while the same man did ten strict pull-ups, so it was never the lift
// that was limiting him.
export const DAY_TEMPLATES = [
  {
    key: 'upper_a',
    label: 'Upper A – Heavy',
    items: [
      { name: 'Face Pulls', sets: 2, reps: '20–25' },
      { name: 'Smith Flat Press', sets: 3, reps: '6–8' },
      { name: 'Machine Row', sets: 3, reps: '6–8' },
      { name: 'Incline DB Bench (neutral grip)', sets: 2, reps: '10–12' },
      { name: 'Weighted Pull-Ups', sets: 3, reps: '5–8' },
      { name: 'Lateral Raises (strict, light)', sets: 3, reps: '15–20' },
      { name: 'Incline DB Curls', sets: 2, reps: '10–12' },
      { name: 'Cable Rope Pushdowns', sets: 2, reps: '10–12' },
    ],
  },
  {
    key: 'lower_a',
    label: 'Lower A – Heavy',
    items: [
      { name: 'Leg Press', sets: 3, reps: '6–8' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8–10' },
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
      { name: 'Pull-Ups (bodyweight)', sets: 4, reps: '6–10' },
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
