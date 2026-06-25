---
name: Nocturnal Bodegón
colors:
  surface: '#151406'
  surface-dim: '#151406'
  surface-bright: '#3c3a29'
  surface-container-lowest: '#100e03'
  surface-container-low: '#1e1c0e'
  surface-container: '#222011'
  surface-container-high: '#2c2a1b'
  surface-container-highest: '#373525'
  on-surface: '#e8e3cb'
  on-surface-variant: '#c2c9bb'
  inverse-surface: '#e8e3cb'
  inverse-on-surface: '#333121'
  outline: '#8c9387'
  outline-variant: '#42493e'
  surface-tint: '#a1d494'
  primary: '#a1d494'
  on-primary: '#0a3909'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#3b6934'
  secondary: '#e3beb8'
  on-secondary: '#422a26'
  secondary-container: '#5b403c'
  on-secondary-container: '#d1ada7'
  tertiary: '#e9c349'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cca730'
  on-tertiary-container: '#4f3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#e3beb8'
  on-secondary-fixed: '#2b1613'
  on-secondary-fixed-variant: '#5b403c'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#151406'
  on-background: '#e8e3cb'
  surface-variant: '#373525'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  card-overlap: -40px
---

## Brand & Style
The design system is inspired by the intimate, competitive, and highly social atmosphere of a classic Buenos Aires "bodegón" or billiard hall at night. It avoids the neon flash of modern casinos in favor of a sophisticated, artisanal aesthetic that honors the heritage of Argentine Truco.

The style is a blend of **Tactile Realism** and **Modern Minimalism**. It utilizes rich textures (felt, wood, paper) and depth through subtle lighting, paired with clean, functional UI layouts. The visual language incorporates "Fileteado Porteño" influences—specifically through the use of gold accents and elegant curves—without cluttering the interface. The emotional response should be one of focused competition, warmth, and cultural authenticity.

## Colors
The palette is rooted in the physical environment of the game. 

- **Primary (Green Felt):** Used for the main gameplay surface and primary action backgrounds. It provides a calm, high-contrast base for the cards.
- **Secondary (Rich Wood):** Used for structural elements like sidebars, headers, and container backgrounds, grounding the UI in a physical space.
- **Tertiary (Gold):** Reserved for highlights, fileteado-inspired flourishes, win states, and high-priority call-to-actions.
- **Neutral (Cream):** Replaces pure white to mimic aged cardstock and parchment, used for card faces and primary text on dark backgrounds.
- **Team Accents:** Vibrant Red ("Nos") and Blue ("Ellos") are used strictly for score tracking and team-specific indicators to ensure immediate legibility during fast-paced play.

## Typography
The typography strategy creates a tension between tradition and utility. 

**Libre Caslon Text** is used for all major headings and display moments (e.g., "¡TRUCO!", "Quiero"). It evokes the hand-painted signage found in San Telmo and provides an editorial, sophisticated feel.

**Hanken Grotesk** handles the heavy lifting of the UI. It is a sharp, contemporary sans-serif that ensures numbers, player names, and log entries remain legible even at small sizes on mobile devices. All labels use a slight tracking increase and bold weight to differentiate them from body content.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a focus on a "Table-Centric" hierarchy. 

- **Desktop:** A 12-column grid where the central 8 columns are dedicated to the felt table surface, and the outer 4 columns (2 on each side) house the match log and score tracking.
- **Mobile:** A vertical stack where the table occupies the top 60% of the screen, with a retractable "drawer" for the match log and a permanent header for the score.
- **Spacing Rhythm:** Based on a 4px baseline. Components use 16px (4 units) or 24px (6 units) of internal padding to maintain a spacious, premium feel. 
- **Card Spacing:** In the player's hand, cards use a negative horizontal margin (`card-overlap`) to simulate a natural fan, expanding on hover or touch.

## Elevation & Depth
Depth is used to simulate the physical layering of a card game.

1.  **Level 0 (The Table):** Dark green felt texture with a slight inner shadow to suggest a recessed surface.
2.  **Level 1 (Card Slots):** Subtle, dashed gold outlines or darkened "depressions" in the felt where cards are played.
3.  **Level 2 (Active Cards):** Cards feature a crisp, short shadow (4px blur, 20% opacity black) to appear as if sitting directly on the felt.
4.  **Level 3 (UI Modals & Floating Buttons):** These use larger, diffused shadows with a slight secondary color tint (#3E2723) to suggest they are floating significantly above the table.
5.  **Beveling:** Buttons and score markers use a very subtle top-light highlight (0.5px white inner stroke at 20% opacity) to give them a tactile, "pressed" or "polished" wood/metal quality.

## Shapes
This design system uses a **Soft (1)** roundedness profile. 

While the cards themselves have standard rounded corners, the UI containers (match log, scoreboards) use a 4px (0.25rem) radius to maintain a sense of structural rigidity and "old-world" craftsmanship. Primary action buttons ("Quiero", "Envido") use a slightly more pronounced 8px (0.5rem) radius to make them more inviting to the touch, distinguishing them from the informational panels.

## Components

### Buttons
Primary buttons use the Gold (#D4AF37) fill with dark brown text for the highest prominence. Secondary buttons (e.g., "Mazo") use a wood-textured background with cream text. All buttons feature a subtle 1px inset highlight on the top edge to create a tactile "polished" effect.

### Score Tracking (The "Tanto")
The score is displayed using traditional tally marks (palotes) arranged in squares of 5. These are rendered in the team's respective color (Red or Blue) against a cream parchment background. The container for the score is framed in a thin gold border.

### Match Log
A compact, vertical list using `label-sm` for timestamps and `body-md` for actions. The log uses a "Wood" background with low-opacity cream dividers. Key actions like "¡Truco!" are highlighted in gold italics.

### Cards
Cards are the hero of the system. They use the Cream (#FFF9E1) background. The "backs" of the cards feature a subtle, geometric pattern in Dark Wood and Gold. When a card is played, it undergoes a slight rotation animation (±3 degrees) to mimic the imperfection of hand-played cards.

### Input Fields
Used for chat or name entry. These are "ghost" style inputs: a simple cream underline on the dark wood background, with the gold accent color appearing only when the field is focused.