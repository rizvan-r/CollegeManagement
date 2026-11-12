IMPORTANT DESIGN SYSTEM UPDATE:

The College Management Portal already has an established web UI color system.

The mobile application MUST use the exact same color palette.

Do not use the previously suggested navy #163A63 or teal #0F9D94.

Use these official colors:

Brand:
- Primary: #1E3A8A
- Primary Light: #3B82F6
- Primary Dark: #1E293B
- Accent: #0D9488

Surfaces:
- Background: #F8FAFC
- Surface: #FFFFFF
- Border: #E2E8F0
- Border Light: #F1F5F9

Typography:
- Text Primary: #0F172A
- Text Secondary: #64748B
- Text Muted: #94A3B8

Status:
- Success: #10B981
- Warning: #F59E0B
- Danger: #EF4444
- Info: #3B82F6

Role colors:
- Admin: background #EEF2FF, accent #4F46E5
- HOD: background #F0FDF4, accent #16A34A
- Faculty: background #FEF3C7, accent #D97706
- Student: background #ECFDF5, accent #059669

Implementation instructions:
1. Inspect the existing web application's index.css and mobile color constants.
2. Treat the supplied palette as authoritative.
3. Centralize colors in mobile/src/constants/colors.js.
4. Reuse the color tokens throughout all mobile screens and components.
5. Preserve the existing web application design.
6. Do not introduce unrelated colors.
7. Maintain accessibility and readable text contrast.
8. Update all Phase 1 screens to match this design system.

This instruction supersedes all earlier color suggestions.