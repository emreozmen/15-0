# 15-0 Game Design

## Core Fantasy

15-0 is a mobile-first football draft and match simulation game built around the Weekend League feeling: build a squad, survive absurd match events, and try to finish a perfect 15 win run.

The hook is not only selecting strong players. The run should feel like modern football-game chaos: momentum swings, goalkeepers doing impossible saves, late cutbacks, trivela goals, tilted opponents, booster cards, and esports-style tactical advantages.

## Product Position

- Mobile game first, not a generic web app.
- Fast sessions: one draft plus one simulated match should fit into a short break.
- Humor and recognition are part of the fun. Events should feel like things players complain about after real FC matches.
- Official EAFC names, card art, club crests, and ratings should only be used if licensing/data rights are solved. Until then, use original parody-style card data and a compatible card schema.

## Run Structure

1. Start a 15-match run.
2. Draft a squad from card picks.
3. Choose boosters and one esports pro advantage.
4. Simulate matches one by one.
5. Each match runs through live events by minute.
6. Result affects record, morale, and momentum profile.
7. The goal is 15-0. One loss does not end the run, but it ruins perfection.

## Draft Loop

Each draft round gives 3 to 5 card options.

Card attributes:

- Position
- Overall
- Pace
- Shooting
- Passing
- Dribbling
- Defending
- Physical
- PlayStyles
- Chemistry tags
- Temperament

Important design rule: the best overall card should not always be the best pick. Chemistry, event resistance, clutch score, and tilt resistance should matter.

## Match Engine

Each match has hidden state:

- Team quality
- Chemistry
- Form
- Momentum
- Opponent pressure
- Script risk
- Player clutch
- Keeper variance
- Booster effects

Matches are not instant. They play as a timeline with live events.

Example events:

- 12' Green timed finesse, keeper flies.
- 23' Ball hits the post and rolls across the line.
- 26' Opponent keeper clears from the line.
- 33' Opponent trivela from nowhere: goal.
- 45+2' Kickoff glitch chance.
- 67' Your fullback forgets the back post.
- 78' Esports pro reads the press and creates a counter.
- 90+1' Momentum check: one last chance.

## Live Event Types

- Chance
- Save
- Woodwork
- Referee decision
- Momentum swing
- Booster trigger
- Skill move
- Defensive error
- Keeper mistake
- Late drama
- Goal

The panel should be readable like a match feed, but emotionally it should feel chaotic.

## Boosters

Boosters are one-run or one-match modifiers.

Examples:

- Red Pick Aura: +clutch in late events.
- Keeper Hands: reduces absurd keeper mistakes.
- Green Timing: improves high-quality chance conversion.
- Anti Momentum: lowers negative momentum chains.
- Trivela License: unlocks rare outside-foot goal events.
- Press Breaker: reduces conceded chances after opponent pressure.

## Esports Pro Slot

Before the run or before key matches, the player can select one esports pro archetype.

Examples:

- The Mechanic: boosts skill move and green timing events.
- The Tactician: counters pressure and narrows opponent momentum windows.
- The Ice Player: improves 80+ minute decisions.
- The Rat King: unlocks cutback and kickoff chaos.

Use fictional names until licensing is available.

## Match Result Feel

The player must feel:

- "My draft decision mattered."
- "The game did something ridiculous."
- "I can reduce chaos but never fully remove it."
- "One more match."

## MVP

The first playable version should include:

- Mobile portrait layout.
- 15-match run tracker.
- Draft picks from parody card data.
- Three boosters.
- One esports pro selection.
- Simulated match timeline.
- Live events panel.
- Win/loss/draw result logic.
- Basic persistence.

## Later Features

- Seasons and leaderboards.
- Shareable 15-0 result card.
- Daily draft challenge.
- Card rarity animations.
- Pack-style unlocks.
- Real FC-style card database if legally available.
- Turkish and English language support.
