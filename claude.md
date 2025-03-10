// Conceptual Design for MuscleKitty Shop Screen

/*
This is a design specification for the achievements screen.
This is not actual implementation code but describes the layout and components.

LAYOUT STRUCTURE:
===============================

┌─────────────────────────────┐
│  ┌─────────────────────┐    │
│  │                     |    │  <- Card with avatar, level and XP
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│                             │
│  ________________________   |   
│ |  Food     |     Toys   |  | <- Shop with food and toys, showing individual items in cards
│ |_________________________  |                          
│ |  ___      │    ____    |  |
│ | |   |     |   |    |   |  │
│ | |___|     |   |____|   |  │
│ │                        |  |
│ |  ___      │    ____    |  |      
│ | |   |     |   |    |   |  │
│ | |___|     |   |____|   |  |      
│ │ _______________________|  |
│                             |
|_____________________________|


CONTEXT:
This is a new Shop tab which allows users to shop for accessories, namely food, or toys, or both, for their kittens.
Purchase of each item requires paying XP, which are achieved by completing workouts. 

COMPONENT SUGGESTIONS:
1. A card that shows the kitty avatar, and the level it currently is. The level is determined by the
number of XP the kitty has gained, which correlates to the consistency and number of workouts the user has done.
Design this such that there is no limit to the levels, and each level gets exponentially harder to reach.

So for instance, getting from level 1 to 2 requires one workout, but getting from level 100 to 101 requires a year of consistent workout (for eg).

The level should dynamically change as the user gains more XP in real time.

2. A shop with 2 sections, food and toys. Each section witll have cards, displaying the food picture, its name, and the amount of XP needed to purchase it
Clicking each card will purchase highlight / select it as it pops up, and a confirmation dialog will pop up to confirm the purchase.

If there is sufficient XP, purchase the item, with a confetti, and decrease the current XP by that amount
*/