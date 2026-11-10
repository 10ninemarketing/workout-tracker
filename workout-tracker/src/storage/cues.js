// Form cues, keyed by exercise name. App content rather than user data, so it
// lives in code and updates with the app - no migration, nothing to back up.
//
// Three or four lines each, in the order you do them: set up, move, finish.
// They exist because "I don't know how to do this" is a reason an exercise
// gets skipped, and the moment that matters is standing at the machine, not
// reading something later.
export const CUES = {
  '45° Back Extension': [
    'Pad just below the hip bones, not digging into your stomach.',
    'Arms crossed on your chest, back flat and stays flat the whole time.',
    'Bend at the hips only — let your torso fall until it is near vertical.',
    'Squeeze your glutes to come up and STOP level with your legs. Arching past straight is the only way to hurt yourself here.',
  ],
  'Hip Thrust': [
    'Shoulder blades on the bench edge, feet flat, shins vertical at the top.',
    'Pad across the hips, chin tucked, ribs down.',
    'Drive through your heels until hips are level with knees. No higher.',
  ],
  'Leg Press': [
    'Feet shoulder-width, middle of the platform.',
    'Lower until your knees reach about 90°, under control.',
    'Stop before your lower back peels off the pad — that is the real limit, not your legs.',
    'Push through your heels, and leave the knees slightly bent at the top.',
  ],
  'Split Squats': [
    'Rear foot back far enough that your front shin stays near vertical.',
    'Drop straight down, back knee toward the floor. Not forward.',
    'Front heel stays planted the whole rep.',
  ],
  'Walking Lunges': [
    'Step out far enough that the front shin stays near vertical.',
    'Torso upright, drop the back knee toward the floor.',
    'Push off the front heel to stand into the next step.',
  ],
  'Leg Extensions': [
    'Knee joint lines up with the machine pivot, not above or below it.',
    'Squeeze at the top and hold for a beat.',
    'Lower slowly — the way down is where most of this one lives.',
  ],
  'Hamstring Curls': [
    'Knee joint on the machine pivot, hips flat against the pad.',
    'Curl all the way, pause, then lower under control.',
    'Keep your hips down — lifting them is how you turn this into a back exercise.',
  ],
  'Standing Calf Raises': [
    'Balls of the feet on the edge, heels free to drop below.',
    'Full stretch at the bottom, full squeeze at the top.',
    'Slow. Bouncing uses the tendon instead of the muscle.',
  ],
  'Seated Calf Raises': [
    'Pad low on the thighs, close to the knee.',
    'Drop the heels all the way down, pause in the stretch.',
    'Press up tall and hold for a beat.',
  ],
  'Suitcase Carry': [
    'One dumbbell, one side. Stand tall, shoulders level.',
    'Do not lean away from it — the whole point is refusing to bend.',
    'Walk 40 steps, swap hands, walk back.',
  ],
  Plank: [
    'Elbows under shoulders, body in one line from head to heels.',
    'Ribs down, glutes tight, hips neither sagging nor piked up.',
    'Breathe. If you can hold it past 60 seconds easily, it has stopped working.',
  ],
  'Face Pulls': [
    'Rope at about eye height, step back until there is tension at the start.',
    'Pull to your forehead, hands finishing wider than your elbows.',
    'Light. This is prehab, not a back exercise.',
  ],
  'Lat Pulldown': [
    'Shoulder-width NEUTRAL grip — the parallel handles, not the wide bar.',
    'Chest up, pull the bar to your collarbone, elbows down and back.',
    'Think about driving your elbows into your back pockets, not pulling with your hands.',
  ],
  'Smith Flat Press': [
    'Bar set so it touches at the bottom of your sternum.',
    'Elbows at about 45° from your body, not flared to 90°.',
    'Touch, pause, press. No bouncing off the chest.',
  ],
  'Machine Row': [
    'Chest against the pad, no rocking back to start the rep.',
    'Pull the handles to your ribs, elbows close.',
    'Hold the squeeze for a beat before letting it back out.',
  ],
  'Incline DB Bench (neutral grip)': [
    'Bench at about 30°. Palms facing each other the whole set.',
    'Lower to the upper chest, elbows tucked — the neutral grip is what keeps the shoulder happy.',
    'Press up and slightly together.',
  ],
  'DB Neutral-Grip High-Incline Press (~60°)': [
    'Bench steeper, around 60°. Palms facing each other.',
    'Lower to the collarbone, elbows in front of your body.',
    'Lighter than the 30° version. It should be.',
  ],
  'Lateral Raises (strict, light)': [
    'Light enough that nothing swings. If your knees move, drop the weight.',
    'Raise to shoulder height, little fingers slightly high.',
    'Lower over three full seconds.',
  ],
  'Cable Y-Raise': [
    'Cables low, cross them in front, raise out into a Y above your head.',
    'Thumbs leading, arms almost straight.',
    'Light. Reps are the progression here, not load.',
  ],
  'Cable External Rotations': [
    'Elbow pinned to your side, forearm across your stomach to start.',
    'Rotate out, keeping the elbow glued in place.',
    'Very light. This is a warm-up for the shoulder, not a set.',
  ],
  'Cable Chest Press (low→mid angle)': [
    'Cables set low, press up and in toward the middle of your chest.',
    'Step into it so there is tension before the first rep.',
    'Finish with the handles close together.',
  ],
  'Pull-Ups (bodyweight)': [
    'Full hang at the bottom, every rep.',
    'Chest to the bar, elbows down.',
    'Stop the set when a rep slows badly, not when you fail one.',
  ],
  'Chest-Supported DB Row (1-arm)': [
    'Chest on the incline bench, no body english available — that is the point.',
    'Pull the dumbbell to your hip, elbow close.',
    'Full stretch at the bottom each rep.',
  ],
  Dips: [
    'Lean forward slightly for chest, stay upright for triceps.',
    'Go to about 90° at the elbow. Deeper is not better for your shoulders.',
    'Stop the set well before form breaks.',
  ],
  'Incline DB Curls': [
    'Bench at 45°, arms hanging straight behind your body.',
    'That stretch at the bottom is the whole reason for the incline — do not cut it short.',
    'Curl without letting the elbow drift forward.',
  ],
  'Hammer Curls': [
    'Palms facing each other, thumbs up, throughout.',
    'Elbows stay at your sides.',
    'Lower slowly — no swinging the weight back down.',
  ],
  'Cable Rope Pushdowns': [
    'Elbows pinned to your sides and they stay there.',
    'Push down and spread the rope apart at the bottom.',
    'Squeeze for a beat at full extension.',
  ],
}

export function cuesFor(name){
  return CUES[name] || null
}
