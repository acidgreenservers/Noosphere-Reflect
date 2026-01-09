# AI Service Brand Colors Reference

**Last Updated**: January 8, 2026  
**Purpose**: Official brand colors for supported AI platforms

---

## Supported Services

### 1. Claude (Anthropic)
**Primary Colors:**
- **Orange (Primary Accent)**: `#d97757` or `#DE7356` (Peach)
- **Dark**: `#141413` (Cod Gray)
- **Light**: `#faf9f5` (Cararra)

**Secondary Colors:**
- **Blue**: `#6a9bcc`
- **Green**: `#788c5d`
- **Mid Gray**: `#b0aea5`
- **Light Gray**: `#e8e6dc`

**Recommended for UI:**
- Card background: `bg-orange-900/40`
- Text: `text-orange-200`
- Border: `border-orange-700/50`

---

### 2. ChatGPT (OpenAI)
**Primary Colors:**
- **Green (ChatGPT)**: `#00A67E` or `#74aa9c`
- **Purple (ChatGPT Pro)**: `#ab68ff`
- **White**: `#FFFFFF`

**OpenAI Brand:**
- **Black (Cod Gray)**: `#080808`
- **White**: `#FFFFFF`

**Recommended for UI:**
- Card background: `bg-emerald-900/40`
- Text: `text-emerald-200`
- Border: `border-emerald-700/50`

---

### 3. Gemini (Google)
**Primary Colors:**
- **Blue**: `#4796E3` or `#078EFA` (Star Blue: `#2196f3`)
- **Purple**: `#9177C7` or `#AD89EB`
- **Red/Pink**: `#CA6673` or `#f48fb1`

**Secondary Colors:**
- **Yellow (Lens)**: `#ffeb3b`
- **Cyan**: `#80deea`
- **White**: `#fdfdfd`
- **Black**: `#0d0d0d`

**Recommended for UI:**
- Card background: `bg-blue-900/40`
- Text: `text-blue-200`
- Border: `border-blue-700/50`
- Accent: Purple gradient for shimmer

---

### 4. Grok (xAI)
**Primary Colors:**
- **Black**: `#000000`
- **White**: `#FFFFFF`

**Recommended for UI:**
- Card background: `bg-black`
- Text: `text-white`
- Border: `border-gray-800`

---

### 5. LeChat (Mistral AI)
**Primary Colors:**
- **Orange**: `#FF7000` (Mistral brand)
- **Black**: `#000000`
- **White**: `#FFFFFF`

**Recommended for UI:**
- Card background: `bg-orange-900/40`
- Text: `text-orange-200`
- Border: `border-orange-700/50`

---

### 6. Llamacoder (Together AI)
**Primary Colors:**
- **White**: `#FFFFFF`
- **Black**: `#000000`

**Recommended for UI:**
- Card background: `bg-white text-black`
- Text: `text-black`
- Border: `border-gray-200`

---

## Current Implementation

### MemoryCard.tsx (Line 52)
```typescript
case 'claude': return 'bg-orange-900/40 text-orange-200 border-orange-700/50';
```

### Needs Implementation
- ChatGPT: `bg-emerald-900/40 text-emerald-200 border-emerald-700/50`
- Gemini: `bg-blue-900/40 text-blue-200 border-blue-700/50`
- Grok: `bg-gray-900/40 text-gray-200 border-gray-700/50`
- LeChat: `bg-orange-900/40 text-orange-200 border-orange-700/50`
- Llamacoder: `bg-purple-900/40 text-purple-200 border-purple-700/50`

---

## Usage Recommendations

### For Archive Hub Cards
Use subtle backgrounds with brand-appropriate borders:
```typescript
const getPlatformColors = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'claude': return 'bg-orange-900/20 border-orange-500/30';
    case 'chatgpt': return 'bg-emerald-900/20 border-emerald-500/30';
    case 'gemini': return 'bg-blue-900/20 border-blue-500/30';
    case 'grok': return 'bg-gray-900/20 border-gray-500/30';
    case 'lechat': return 'bg-orange-900/20 border-orange-500/30';
    case 'llamacoder': return 'bg-purple-900/20 border-purple-500/30';
    default: return 'bg-gray-900/20 border-gray-500/30';
  }
};
```

### For Model Badges
Use higher opacity for better visibility:
```typescript
const getModelBadgeColors = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'claude': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'chatgpt': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'gemini': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    // ... etc
  }
};
```

---

## Notes

- **Verified**: Claude, ChatGPT, Gemini have official brand guidelines
- **Needs Research**: Grok, Llamacoder specific brand colors
- **LeChat**: Uses Mistral AI branding (orange)
- **Current Default**: Green theme (Noosphere Nexus)

---

**Next Steps:**
1. Implement platform-specific colors in `MemoryCard.tsx`
2. Add platform detection in `ArchiveHub.tsx` conversation cards
3. Create platform badge component with brand colors
4. Verify Grok and Llamacoder official colors
