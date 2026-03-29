## 2024-05-22 - [Universal Event Delegation in Cards]
**Learning:** In composite card components where the entire card is clickable, secondary actions MUST explicitly stop event propagation and prevent defaults to avoid triggering the primary card-level action.
**Action:** Always wrap internal button clicks in a handler that includes `e.stopPropagation()` and `e.preventDefault()`.

## 2024-05-22 - [Interactive Visual Feedback Scaling]
**Learning:** High scale values (e.g., 1.1) in hover transitions can feel "jumpy" and cause layout overlap issues if cards are closely packed.
**Action:** Use subtle scale values like `1.02` or `1.03` combined with `hover:z-10` to ensure a smooth, professional focus effect that doesn't obscure neighboring content.
