# Oath of the Peck: The Living Battlefield

A new, playable real-time concept mode for Crash Out Studio's War of Fate card game. This is a prototype of the requested card-to-battlefield loop, not a conversion of the production turn-based TCG.

## Play and run locally

[Play the hosted prototype](https://oath-of-the-peck-live-battle.crash-out-crypto.chatgpt.site/). The hosted game requires the owner's ChatGPT sign-in; local play does not require an account.

Clone `https://github.com/GrandJiraiya/TCG-proto.git`, then run from the project directory:

```bash
python3 -m http.server 420 --directory dist
```

Open `http://localhost:420/`. On Windows, use `python` instead of `python3` if that is your installed command. Serve the files over HTTP rather than opening `index.html` directly, because the game uses ES modules. No package installation or build is required.

Run the gameplay checks with Node.js:

```bash
npm test
```

Choose a commander, click or tap a Front directly on the ground, then play a card from your hand. A gold outline marks the selected deployment Front. Landscape orientation gives phones the original left/player, center/battlefield, right/opponent arrangement. Browser resizing and either camera view keep the selectable ground aligned.

All runtime source and character artwork are in `dist/`; automated combat checks are in `tests/`. Any static host can serve `dist/`. `.openai/hosting.json` identifies the existing ChatGPT Site deployment.

## The direction

The player commands through cards on the left; the opponent commands from the right. A shared 3D battlefield in the center shows the consequences continuously. Troops move, acquire targets, fight, and attack Strongholds while both commanders play cards. Cards change the actual simulation, including the behavior and damage of deployed squads.

The existing three Fronts, mirrored sides, leader identity, Stronghold, Command, Soul, Oaths, and Fate Ledger form the foundation. The uploaded Foundation 0.9 UI fix plan supplies the earlier layout direction; the new user instruction supersedes its alternating-turn presentation for this mode. The two attached Foundation text files contain link labels rather than the underlying design documents. Earlier rules were recovered from project context; the current production repository was not audited or modified.

## Implemented vertical slice

- Click or tap the 3D ground to select West, Center, or East, then play a card to deploy there. A gold outline marks the selected Front. Projected, accessible hit areas follow camera changes and resizing; the previous tab selector has been removed.
- Three true 3D Fronts: West, Center, East; two camera angles; low-poly avian soldiers, archers, shields, fortresses, projectiles, casualty reduction, hit effects, and health bars.
- Left player command panel and selectable cards. Right AI commander, concealed hand representation, public resources, doctrine, revealed upgrades, and Oaths.
- Indigo: infantry health bonus and Radiant Rally. Lucy: archer range/slow and Winter's Grasp. Nezz: melee movement and wounded-target bonus, with Void Step and an attack surge. These are new mechanical adaptations, not canon changes to the printed cards.
- Leader choice changes the signature card, guard identity, passive army behavior, and opposing commander.
- Real-time Command regeneration, legal card checks, active army cap, five-card hand, 16-card cyclic training deck, discard reshuffle, and seeded AI.
- Infantry, archers, guards, Fire Arrows, Shield Wall, Field Mending, leader-exclusive command, and Oath of the Line.
- Oath fulfillment and breach with a conserved six-Soul economy; maximum two active Oaths. Soul can be free, bound in an Oath, or Debt. Debt currently occupies Soul capacity; additional collection mechanics are not implemented.
- Stronghold win/loss and same-step mutual-destruction draw; pause, speed control, rematch, field guide, leader preference remembered on this browser.
- Keyboard 1–5 and mobile controls. Portrait screens put the battlefield above the left/right commander panels; landscape offers the intended flanking-card layout.

## Fire Arrows: the flagship interaction

Playing it adds a permanent army doctrine for that match. All friendly archers across all three Fronts gain +3 shot damage and a non-stacking 2 damage/second burn lasting 3 seconds. Archers deployed later inherit it. Infantry and enemy archers do not. Existing arrows already in flight retain their launch-time attributes. The upgrade cannot stack or be bought again while active. Burning targets show flames; upgraded archers carry flame at their weapon, and their projectiles visibly change. Each squad's health is shared by three visible soldiers; the representation sheds soldiers at health thresholds.

## What the leader should eventually govern

1. Deck legality: leader/faction tags, a unique leader outside the draw deck, signature access, allowed troop and support families.
2. Army doctrine: targeting priorities, formation spacing, preferred engagement range, protection, movement, and morale.
3. Build identity: permanent army upgrades, card combinations, leader abilities, equipment, and Oath incentives.
4. RPG growth: campaign encounters, card collection, horizontal leader specializations, troop variants, optional equipment loadouts, and rewards. Progression should widen tactical choices and visibly change armies. No campaign or collection progression is claimed by this prototype.

Not all of these layers are implemented. This prototype demonstrates leader-specific stats, range/slow, mobility, wound exploitation, signatures, and guard identity. Full faction legality, a collection screen, morale, formation controls, and persistent progression remain design work.

## Rules carried forward versus adapted

| Earlier TCG foundation | Real-time prototype |
| --- | --- |
| Three Fronts, Vanguard/Rear | Three physical battle corridors; melee advance, archers hold range. Formal rank slots and movement orders remain future work. |
| 25 Stronghold Integrity | Preserved as the prototype victory target; all damage values are retuned experiments. |
| Command 2–8, refill at Dawn | Replaced in this mode by a 10-point cap and 0.7 Command/second, starting at 7. |
| Six Soul; Oath fulfillment/breach; two active Oaths | Preserved conceptually; one new timed Oath implemented. |
| Alternating actions, Dawn/Action/Dusk, reaction windows | Replaced by continuous 30 Hz combat. Timed tactical responses are cards; a formal reaction system is not implemented. |
| 24-card constructed deck, copy limits | Five-card hand with a 16-card training deck of eight card types, two copies each. Full constructed format is deferred. |
| Terrain, thresholds, fortification, fatigue, Pressure | Arena geometry is presentation. These older mechanics are not silently claimed as implemented. |
| Deterministic engine and Fate Ledger | Fixed-step, seeded local simulation with an action ledger. This is separate from the original engine and has no exported replay verification yet. |

## Next development sequence

1. Playtest the core loop: prove army-wide upgrades are readable and useful, leader choice is observable, and three simultaneous Fronts remain manageable. Tune durations, costs, and target selection before adding more systems.
2. Expand deck construction and RPG progression: leader legality, troop families, training/deck screens, card rewards, equipment, and a short campaign encounter path. Keep presentation/canon separate from balance data.
3. Add terrain/Oath depth, richer creature animation and formations, then evaluate the larger 3D implementation path. Online PvP requires an authoritative simulation and synchronized commands; this local AI prototype does not provide multiplayer.

## Architecture and verification

Buildless HTML/CSS/ES modules, local card/simulation state in `dist/sim.js`, custom batched WebGL geometry in `dist/renderer.js` with a software 3D fallback for browsers without WebGL, and UI in `dist/app.js`. Both renderers project the same world-space geometry through a perspective camera. No external packages, network APIs, or downloaded scripts are needed at runtime. Source character-card art is supplied by the user's project files. `node --test tests/*.test.mjs` verifies army-wide upgrades, simultaneous combat, distinct leader effects, Soul conservation, invalid-order handling, draw resolution, AI completion, deck accounting, and seeded reproducibility.
