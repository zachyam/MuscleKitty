// Conceptual Design for MuscleKitty Onboarding Screen

/*
This is a design specification for the onboarding screen to match the self-care app reference.
This is not actual implementation code but describes the layout and components.

LAYOUT STRUCTURE:
===============================

┌─────────────────────────────┐
│ ← [Back Button]             │ <- Header with navigation controls
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │ Welcome Message     │    │ <- Card with welcome text
│  │ Let's get started!  │    │
│  └─────────────────────┘    │
│                             │
│                             │
│        [Mascot Image]       │ <- Centered mascot image
│                             │
│                             │
│     Meet your fitness       │
│          bestie!            │ <- Title text
│                             │
│  Muscle Kitty will support  │
│  your fitness goals every   │ <- Subtitle text
│     step of the way! 🐱     │
│                             │
│                             │
│       [Next Button]         │ <- Primary action button
│                             │
│        ● ○ ○ ○              │ <- Pagination indicators
└─────────────────────────────┘

COLOR SCHEME:
- Background: Light green (#F5F9EE)
- Card background: White (#FFFFFF)
- Primary button: Green (#8FC93A)
- Text: Dark gray (#333333)
- Secondary text: Medium gray (#888888)

COMPONENT SUGGESTIONS:
1. Header Bar with:
   - Back button (left) - Only visible after first screen

2. Welcome Card:
   - Rounded corners (30px radius)
   - White background
   - Bold title text
   - Subtle shadow

3. Mascot Image:
   - Circular image (200x200px)
   - Border in primary color

4. Text Section:
   - Title: Large, bold text (28px)
   - Subtitle: Medium text (18px), lighter color

5. Next Button:
   - Full width button with primary color
   - Rounded corners (30px radius)
   - White text
   - Text changes to "Get Started" on final screen

6. Pagination Indicators:
   - Small circles for each screen
   - Active screen highlighted with primary color
   - Inactive screens in lighter color

ONBOARDING FLOW CONTENT:
Screen 1:
- Welcome: "Let's get your fitness journey started!"
- Title: "Meet your fitness bestie!"
- Subtitle: "Muscle Kitty will support your fitness goals every step of the way! 🐱"

Screen 2:
- Welcome: "Build your perfect workout!"
- Title: "Create Workout Plans"
- Subtitle: "Design and customize your own workout routines with exercises that fit your goals."

Screen 3:
- Welcome: "Watch yourself grow stronger!"
- Title: "Track Your Progress"
- Subtitle: "Log your workouts, see your improvement over time, and stay motivated!"

Implementation Notes:
- This flow should be shown AFTER the user is logged in, and ONLY if it's their first time logging in
- Store completion status in local storage
- Support back navigation between screens
*/