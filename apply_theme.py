#!/usr/bin/env python3
"""
Align user and admin dashboards styling with homepage (clean studio editorial white palette).
"""
import shutil

# Restore clean backup first
shutil.copyfile('/home/kkdams/photoart/css/style.css.bak', '/home/kkdams/photoart/css/style.css')

css_path = '/home/kkdams/photoart/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Update :root
root_old = """:root {
    /* Studio Noir Luxury Palette */
    --bg-base: #07090e;
    --bg-surface: #101420;
    --bg-surface-elevated: #171c2c;
    --bg-surface-glass: rgba(14, 17, 26, 0.82);
    --bg-card: rgba(18, 22, 34, 0.82);
    --bg-card-hover: rgba(24, 29, 44, 0.88);
    --bg-input: #0b0d14;

    /* Hairline Studio Borders & Accents */
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-card: rgba(255, 255, 255, 0.13);
    --border-strong: rgba(255, 255, 255, 0.24);
    --border-glow: rgba(244, 63, 94, 0.45);
    --border-gold: rgba(245, 158, 11, 0.45);

    /* Brand Accents */
    --brand-rose: #f43f5e;
    --brand-rose-hover: #e11d48;
    --brand-rose-glow: rgba(244, 63, 94, 0.38);
    --brand-amber: #f59e0b;
    --brand-amber-glow: rgba(245, 158, 11, 0.3);
    --brand-gold: #fbbf24;
    --brand-cyan: #38bdf8;
    --brand-emerald: #10b981;

    /* Legacy mapping for compatibility */
    --primary: var(--brand-rose);
    --primary-hover: var(--brand-rose-hover);
    --secondary: #6366f1;
    --accent: var(--brand-amber);
    --border-color: var(--border-card);

    /* Typography Colors */
    --text-pure: #ffffff;
    --text-primary: #f8fafc;
    --text-body: #cbd5e1;
    --text-muted: #8492a6;
    --text-tint: #fca5a5;

    /* Radius & Spacing */
    --radius-xs: 6px;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-pill: 9999px;

    /* Shadows & Transitions */
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 10px 28px -4px rgba(0, 0, 0, 0.6);
    --shadow-lg: 0 20px 48px -8px rgba(0, 0, 0, 0.75);
    --shadow-glow: 0 8px 30px var(--brand-rose-glow);
    --shadow-easel: 0 28px 70px -12px rgba(0, 0, 0, 0.88), 0 0 0 1px rgba(255, 255, 255, 0.12);
    --transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    --transition-bounce: all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}"""

root_new = """:root {
    /* Studio Pure & Editorial Palette (Harmonized with Homepage) */
    --bg-base: #ffffff;
    --bg-surface: #ffffff;
    --bg-surface-elevated: #f9fafb;
    --bg-surface-glass: rgba(255, 255, 255, 0.98);
    --bg-card: #ffffff;
    --bg-card-hover: #fafafa;
    --bg-input: #ffffff;

    /* Crisp Light Hairline Borders */
    --border-subtle: #f3f4f6;
    --border-card: #e5e7eb;
    --border-strong: #d1d5db;
    --border-glow: rgba(0, 0, 0, 0.08);
    --border-gold: rgba(217, 119, 6, 0.45);

    /* Brand Accents */
    --brand-rose: #000000;
    --brand-rose-hover: #1f2937;
    --brand-rose-glow: rgba(0, 0, 0, 0.12);
    --brand-amber: #f59e0b;
    --brand-amber-glow: rgba(245, 158, 11, 0.2);
    --brand-gold: #fbbf24;
    --brand-cyan: #0284c7;
    --brand-emerald: #10b981;

    /* Legacy mapping for compatibility */
    --primary: #000000;
    --primary-hover: #1f2937;
    --secondary: #4b5563;
    --accent: #f59e0b;
    --border-color: var(--border-card);

    /* Typography Colors (Clean, Crisp, High Contrast) */
    --text-pure: #000000;
    --text-primary: #111827;
    --text-body: #374151;
    --text-muted: #6b7280;
    --text-tint: #991b1b;

    /* Radius & Spacing */
    --radius-xs: 6px;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-pill: 9999px;

    /* Soft Clean Elevation Shadows */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
    --shadow-glow: 0 4px 18px rgba(0, 0, 0, 0.12);
    --shadow-easel: 0 18px 48px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px #e5e7eb;
    --transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    --transition-bounce: all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}"""

assert root_old in css, "root_old not found!"
css = css.replace(root_old, root_new)

# 2. Update body & body::before & header.app-header
body_old = """body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: var(--bg-base);
    background-image: 
        radial-gradient(circle at 18% 10%, rgba(244, 63, 94, 0.16) 0%, transparent 40%),
        radial-gradient(circle at 82% 16%, rgba(245, 158, 11, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 50% 88%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
        radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px),
        linear-gradient(180deg, #0e111a 0%, #07090e 100%);
    background-size: 100% 100%, 100% 100%, 100% 100%, 26px 26px, 100% 100%;
    background-attachment: fixed;
    color: var(--text-body);
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
}

/* Subtle top studio illumination accent line */
body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #f43f5e 0%, #fbbf24 50%, #38bdf8 100%);
    z-index: 1001;
    opacity: 0.85;
}

/* ==========================================================================
   HEADER & STUDIO BRANDING
   ========================================================================== */
header.app-header {
    background: var(--bg-surface-glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-card);
    padding: 12px 18px;
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}"""

body_new = """body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #ffffff;
    background-image: 
        radial-gradient(circle at 10% 20%, rgba(0, 0, 0, 0.02) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 40%),
        linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
    background-attachment: fixed;
    color: var(--text-body);
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
}

/* Subtle top studio illumination accent line */
body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #111827 0%, #f59e0b 50%, #111827 100%);
    z-index: 1001;
    opacity: 0.85;
}

/* ==========================================================================
   HEADER & STUDIO BRANDING
   ========================================================================== */
header.app-header {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid #e5e7eb;
    padding: 12px 18px;
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}"""

assert body_old in css, "body_old not found!"
css = css.replace(body_old, body_new)

# 3. Update branding and navigation buttons
nav_old = """/* Luxury Studio Logo Branding */
.luxury-camera-mark {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(145deg, #181d28 0%, #0a0d14 100%);
    border: 1.5px solid rgba(245, 158, 11, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
    flex-shrink: 0;
    padding: 3px;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
}

.logo-brand:hover .luxury-camera-mark {
    transform: scale(1.06);
    border-color: rgba(245, 158, 11, 0.8);
    box-shadow: 0 6px 20px rgba(245, 158, 11, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.luxury-camera-svg {
    width: 100%;
    height: 100%;
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.logo-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.logo-title-row {
    display: flex;
    align-items: center;
    gap: 7px;
}

.logo-title-main {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #ffffff;
    -webkit-text-fill-color: #ffffff;
    line-height: 1;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    display: inline-flex;
    align-items: center;
}

/* User Booth Navigation (Only in booth.html) */
.user-header-nav {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-pill);
    padding: 3px 5px;
}

.user-nav-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: var(--transition);
    position: relative;
    font-family: inherit;
    text-decoration: none;
}

.user-nav-btn:hover {
    color: var(--text-pure);
    background: rgba(255, 255, 255, 0.08);
}

.user-nav-btn.active {
    background: linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(245, 158, 11, 0.18) 100%);
    border-color: rgba(244, 63, 94, 0.5);
    color: #ffffff;
    box-shadow: 0 2px 10px rgba(244, 63, 94, 0.25);
}

/* Operator Quick Navigation (Only in admin.html) */
.operator-header-nav {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-operator-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--text-pure);
    padding: 6px 13px;
    border-radius: var(--radius-pill);
    font-size: 11.5px;
    font-weight: 700;
    text-decoration: none;
    transition: var(--transition);
}

.btn-operator-link:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    color: #ffffff;
}"""

nav_new = """/* Luxury Studio Logo Branding */
.luxury-camera-mark {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(145deg, #181d28 0%, #0a0d14 100%);
    border: 1.5px solid rgba(217, 119, 6, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    padding: 3px;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
}

.logo-brand:hover .luxury-camera-mark {
    transform: scale(1.06);
    border-color: rgba(217, 119, 6, 0.85);
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.luxury-camera-svg {
    width: 100%;
    height: 100%;
    display: block;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}

.logo-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.logo-title-row {
    display: flex;
    align-items: center;
    gap: 7px;
}

.logo-title-main {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #000000;
    -webkit-text-fill-color: #000000;
    line-height: 1;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    display: inline-flex;
    align-items: center;
}

/* User Booth Navigation (Only in booth.html) */
.user-header-nav {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-pill);
    padding: 3px 5px;
}

.user-nav-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #4b5563;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: var(--transition);
    position: relative;
    font-family: inherit;
    text-decoration: none;
}

.user-nav-btn:hover {
    color: #000000;
    background: #e5e7eb;
}

.user-nav-btn.active {
    background: #000000;
    border-color: #000000;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
}

/* Operator Quick Navigation (Only in admin.html) */
.operator-header-nav {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-operator-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #111827;
    padding: 6px 13px;
    border-radius: var(--radius-pill);
    font-size: 11.5px;
    font-weight: 700;
    text-decoration: none;
    transition: var(--transition);
}

.btn-operator-link:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    transform: translateY(-1px);
    color: #000000;
}"""

assert nav_old in css, "nav_old not found!"
css = css.replace(nav_old, nav_new)

# 4. Update Step Tracker
step_old = """/* ==========================================================================
   STUDIO STEP TRACKER (01 PILIH ➔ 02 FOTO ➔ 03 CETAK)
   ========================================================================== */
.step-tracker-wrapper {
    background: rgba(10, 13, 20, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 10px 14px;
    position: relative;
}

/* Connecting hairline timeline behind items */
.studio-step-tracker {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    position: relative;
}

.step-track-item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    transition: var(--transition);
    user-select: none;
}

.step-track-item:hover {
    color: var(--text-pure);
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.15);
}

.step-track-item .step-num {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-muted);
    font-weight: 900;
    font-family: monospace;
    letter-spacing: 0.05em;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
}

.step-track-item.active {
    background: linear-gradient(135deg, rgba(244, 63, 94, 0.22) 0%, rgba(245, 158, 11, 0.14) 100%);
    color: #ffffff;
    border-color: rgba(244, 63, 94, 0.5);
    box-shadow: 0 4px 16px rgba(244, 63, 94, 0.25);
}

.step-track-item.active .step-num {
    background: linear-gradient(135deg, var(--brand-rose) 0%, var(--brand-amber) 100%);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(244, 63, 94, 0.4);
}

.step-track-arrow {
    color: rgba(255, 255, 255, 0.25);
    font-size: 13px;
    font-weight: 800;
}"""

step_new = """/* ==========================================================================
   STUDIO STEP TRACKER (01 PILIH ➔ 02 FOTO ➔ 03 CETAK)
   ========================================================================== */
.step-tracker-wrapper {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 14px;
    position: relative;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

/* Connecting hairline timeline behind items */
.studio-step-tracker {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    position: relative;
}

.step-track-item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    transition: var(--transition);
    user-select: none;
}

.step-track-item:hover {
    color: #000000;
    background: #e5e7eb;
    border-color: #d1d5db;
}

.step-track-item .step-num {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: #e5e7eb;
    color: #111827;
    font-weight: 900;
    font-family: monospace;
    letter-spacing: 0.05em;
}

.step-track-item.active {
    background: #000000;
    color: #ffffff;
    border-color: #000000;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.16);
}

.step-track-item.active .step-num {
    background: #ffffff;
    color: #000000;
}

.step-track-arrow {
    color: #9ca3af;
    font-size: 13px;
    font-weight: 800;
}"""

assert step_old in css, "step_old not found!"
css = css.replace(step_old, step_new)

# 5. Update .card
card_old = """/* Studio Cards & Surfaces with Authentic Corner Registration Motifs */
.card {
    position: relative;
    background: var(--bg-card);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 22px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
    transition: var(--transition);
}

/* Glowing Top Accent Hairline */
.card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(244, 63, 94, 0.7) 20%, rgba(245, 158, 11, 0.7) 80%, transparent 100%);
    opacity: 0.85;
}

.card:hover {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-lg), 0 0 24px rgba(244, 63, 94, 0.1);
}

.card-title {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: -0.015em;
    color: var(--text-pure);
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-subtitle {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 16px;
    line-height: 1.55;
}"""

card_new = """/* Studio Cards & Surfaces with Authentic Corner Registration Motifs */
.card {
    position: relative;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-md);
    padding: 22px;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: var(--transition);
}

/* Subtle Top Accent Hairline */
.card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%);
    opacity: 0.85;
}

.card:hover {
    border-color: #d1d5db;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.card-title {
    font-size: 17px;
    font-weight: 900;
    letter-spacing: -0.015em;
    color: #000000;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-subtitle {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 16px;
    line-height: 1.55;
}"""

assert card_old in css, "card_old not found!"
css = css.replace(card_old, card_new)

# 6. Update .hero-banner
hero_old = """.hero-banner {
    position: relative;
    text-align: center;
    padding: 34px 20px 28px;
    margin-bottom: 20px;
    background: 
        radial-gradient(ellipse 70% 60% at 50% 0%, rgba(244, 63, 94, 0.18), transparent 75%),
        radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08), transparent 50%),
        rgba(17, 21, 33, 0.75);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    overflow: hidden;
}

/* Concentric Aperture Rings in Hero Background */
.hero-decor-rings {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 360px;
    height: 360px;
    border-radius: 50%;
    border: 1px dashed rgba(244, 63, 94, 0.24);
    box-shadow: 
        0 0 0 35px rgba(245, 158, 11, 0.05),
        0 0 0 75px rgba(255, 255, 255, 0.02),
        inset 0 0 80px rgba(244, 63, 94, 0.08);
    pointer-events: none;
    z-index: 0;
    animation: slowRotateAperture 60s linear infinite;
}

@keyframes slowRotateAperture {
    from { transform: translateX(-50%) rotate(0deg); }
    to { transform: translateX(-50%) rotate(360deg); }
}

/* Corner registration marks (+) */
.hero-corner-mark {
    position: absolute;
    font-size: 15px;
    font-weight: 400;
    pointer-events: none;
    line-height: 1;
    z-index: 2;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}
.hero-corner-tl { top: 12px; left: 14px; }
.hero-corner-tr { top: 12px; right: 14px; }
.hero-corner-bl { bottom: 12px; left: 14px; }
.hero-corner-br { bottom: 12px; right: 14px; }



.hero-pill-badge {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(244, 63, 94, 0.15) 100%);
    border: 1px solid rgba(245, 158, 11, 0.45);
    color: #fde68a;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: var(--radius-pill);
    margin-bottom: 14px;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
}

.hero-title {
    position: relative;
    z-index: 1;
    font-size: 30px;
    font-weight: 900;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #ffffff 25%, #fecdd3 65%, #fde68a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
    margin-bottom: 10px;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.hero-desc {
    position: relative;
    z-index: 1;
    font-size: 13.5px;
    color: #cbd5e1;
    max-width: 550px;
    margin: 0 auto 16px;
    line-height: 1.65;
}

.hero-features-strip {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.38);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
}

.hero-feat-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #e2e8f0;
}

.hero-feat-dot {
    color: rgba(255, 255, 255, 0.25);
}"""

hero_new = """.hero-banner {
    position: relative;
    text-align: center;
    padding: 34px 20px 28px;
    margin-bottom: 20px;
    background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
    border-radius: var(--radius-lg);
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

/* Concentric Aperture Rings in Hero Background */
.hero-decor-rings {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 360px;
    height: 360px;
    border-radius: 50%;
    border: 1px dashed rgba(0, 0, 0, 0.06);
    box-shadow: 
        0 0 0 35px rgba(0, 0, 0, 0.02),
        0 0 0 75px rgba(0, 0, 0, 0.01);
    pointer-events: none;
    z-index: 0;
    animation: slowRotateAperture 60s linear infinite;
}

@keyframes slowRotateAperture {
    from { transform: translateX(-50%) rotate(0deg); }
    to { transform: translateX(-50%) rotate(360deg); }
}

/* Corner registration marks (+) */
.hero-corner-mark {
    position: absolute;
    font-size: 15px;
    font-weight: 400;
    pointer-events: none;
    line-height: 1;
    z-index: 2;
    color: #9ca3af;
}
.hero-corner-tl { top: 12px; left: 14px; }
.hero-corner-tr { top: 12px; right: 14px; }
.hero-corner-bl { bottom: 12px; left: 14px; }
.hero-corner-br { bottom: 12px; right: 14px; }

.hero-pill-badge {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #111827;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: var(--radius-pill);
    margin-bottom: 14px;
}

.hero-title {
    position: relative;
    z-index: 1;
    font-size: 30px;
    font-weight: 900;
    letter-spacing: -0.025em;
    color: #000000;
    -webkit-text-fill-color: #000000;
    background: none;
    line-height: 1.2;
    margin-bottom: 10px;
}

.hero-desc {
    position: relative;
    z-index: 1;
    font-size: 14px;
    color: #4b5563;
    max-width: 550px;
    margin: 0 auto 16px;
    line-height: 1.65;
}

.hero-features-strip {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 8px 16px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    color: #4b5563;
}

.hero-feat-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #111827;
}

.hero-feat-dot {
    color: #9ca3af;
}"""

assert hero_old in css, "hero_old not found!"
css = css.replace(hero_old, hero_new)

# 7. Update .category-pill & .frame-select-card
cards_old = """.category-pill {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-card);
    color: var(--text-muted);
    padding: 8px 15px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
}

.category-pill:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-pure);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.category-pill.active {
    background: linear-gradient(135deg, var(--brand-rose) 0%, #e11d48 100%);
    border-color: var(--brand-rose);
    color: #ffffff;
    box-shadow: 0 4px 16px var(--brand-rose-glow);
    transform: translateY(-1px);
}

/* Frames Selection Grid */
.frames-selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

@media (max-width: 580px) {
    .frames-selection-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
}

.frame-select-card {
    background: linear-gradient(180deg, #131724 0%, #0d101a 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-bounce);
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
}

.frame-select-card:hover {
    transform: translateY(-6px) scale(1.015);
    border-color: rgba(244, 63, 94, 0.6);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(244, 63, 94, 0.28);
}

.frame-select-card.selected {
    border-color: var(--brand-rose);
    box-shadow: 0 0 0 2px var(--brand-rose), 0 12px 32px var(--brand-rose-glow);
    background: linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, #111422 100%);
}

.frame-select-card.selected::after {
    content: "✓ TERPILIH";
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(135deg, var(--brand-rose) 0%, #e11d48 100%);
    color: #ffffff;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.08em;
    padding: 3px 9px;
    border-radius: var(--radius-pill);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5), 0 0 10px var(--brand-rose-glow);
    z-index: 5;
}

/* Gallery Mat & Corner Tabs on Frame Preview */
.frame-real-preview-wrapper {
    background: radial-gradient(circle at 50% 50%, #111420 0%, #06080d 100%);
    padding: 14px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 210px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    overflow: hidden;
}"""

cards_new = """.category-pill {
    flex-shrink: 0;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    padding: 8px 15px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
}

.category-pill:hover {
    background: #e5e7eb;
    color: #000000;
    border-color: #d1d5db;
    transform: translateY(-1px);
}

.category-pill.active {
    background: #000000;
    border-color: #000000;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    transform: translateY(-1px);
}

/* Frames Selection Grid */
.frames-selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

@media (max-width: 580px) {
    .frames-selection-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
}

.frame-select-card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-bounce);
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.frame-select-card:hover {
    transform: translateY(-4px);
    border-color: #000000;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.frame-select-card.selected {
    border-color: #000000;
    box-shadow: 0 0 0 2px #000000, 0 12px 28px rgba(0, 0, 0, 0.1);
    background: #ffffff;
}

.frame-select-card.selected::after {
    content: "✓ TERPILIH";
    position: absolute;
    top: 8px;
    right: 8px;
    background: #000000;
    color: #ffffff;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.08em;
    padding: 3px 9px;
    border-radius: var(--radius-pill);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 5;
}

/* Gallery Mat & Corner Tabs on Frame Preview */
.frame-real-preview-wrapper {
    background: #f9fafb;
    padding: 14px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 210px;
    border-bottom: 1px solid #f3f4f6;
    position: relative;
    overflow: hidden;
}"""

assert cards_old in css, "cards_old not found!"
css = css.replace(cards_old, cards_new)

# 8. Update timer & buttons
btn_old = """.timer-chip {
    background: linear-gradient(180deg, #161a28 0%, #10131d 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    color: var(--text-body);
    padding: 14px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: var(--transition-bounce);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    text-align: center;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.timer-chip:hover {
    border-color: rgba(255, 255, 255, 0.28);
    background: linear-gradient(180deg, #1c2234 0%, #131724 100%);
    transform: translateY(-2px);
}

.timer-chip.selected {
    border-color: var(--brand-rose);
    background: linear-gradient(180deg, rgba(244, 63, 94, 0.22) 0%, rgba(244, 63, 94, 0.08) 100%);
    color: #ffffff;
    box-shadow: 0 0 0 1px var(--brand-rose), 0 6px 20px rgba(244, 63, 94, 0.3);
    transform: translateY(-2px);
}

/* Primary Button with Luxury Sheen & Pushdown Feedback */
.btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #f43f5e 0%, #e11d48 55%, #ea580c 100%);
    color: #ffffff;
    border: 0;
    padding: 15px 22px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    box-shadow: 0 8px 25px var(--brand-rose-glow), inset 0 1px 0 rgba(255, 255, 255, 0.35);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #fb7185 0%, #e11d48 55%, #f97316 100%);
    box-shadow: 0 10px 32px rgba(244, 63, 94, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.45);
    transform: translateY(-2px);
}

.btn-primary:active {
    transform: translateY(2px);
    box-shadow: 0 4px 12px var(--brand-rose-glow);
}

.btn-secondary {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
    color: var(--text-pure);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    padding: 13px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: var(--transition);
    backdrop-filter: blur(8px);
}"""

btn_new = """.timer-chip {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    color: #111827;
    padding: 14px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    text-align: center;
    position: relative;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.timer-chip:hover {
    border-color: #9ca3af;
    background: #f9fafb;
    transform: translateY(-2px);
}

.timer-chip.selected {
    border-color: #000000;
    background: #000000;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    transform: translateY(-2px);
}

.timer-chip.selected .timer-val {
    color: #ffffff;
}

.timer-chip.selected .timer-label {
    color: rgba(255, 255, 255, 0.85);
}

/* Primary Button with Clean Solid Black Studio Styling */
.btn-primary {
    width: 100%;
    background: #000000;
    color: #ffffff;
    border: 0;
    padding: 15px 22px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
    text-decoration: none;
}

.btn-primary:hover {
    background: #1f2937;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    transform: translateY(-2px);
    color: #ffffff;
}

.btn-primary:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
    background: #ffffff;
    color: #111827;
    border: 1.5px solid #d1d5db;
    padding: 13px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: var(--transition);
    text-decoration: none;
}"""

assert btn_old in css, "btn_old not found!"
css = css.replace(btn_old, btn_new)

# 9. Update Gallery Cards
gal_old = """.gallery-card {
    background: linear-gradient(180deg, #131724 0%, #0d101a 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition: var(--transition-bounce);
    position: relative;
}

.gallery-card:hover {
    transform: translateY(-6px) scale(1.015);
    border-color: rgba(244, 63, 94, 0.55);
    box-shadow: 0 20px 42px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(244, 63, 94, 0.22);
}

.gallery-card-thumb-wrapper {
    position: relative;
    background: radial-gradient(circle at 50% 50%, #111420 0%, #06080e 100%);
    padding: 14px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 210px;
    cursor: pointer;
    overflow: hidden;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}"""

gal_new = """.gallery-card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: var(--transition-bounce);
    position: relative;
}

.gallery-card:hover {
    transform: translateY(-4px);
    border-color: #000000;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.gallery-card-thumb-wrapper {
    position: relative;
    background: #f9fafb;
    padding: 14px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 210px;
    cursor: pointer;
    overflow: hidden;
    border-bottom: 1px solid #f3f4f6;
}"""

assert gal_old in css, "gal_old not found!"
css = css.replace(gal_old, gal_new)

# 10. Update Admin Vault and Stat Cards
admin_old = """.admin-vault-card {
    background: linear-gradient(180deg, #151928 0%, #0d101a 100%);
    border: 1.5px solid rgba(239, 68, 68, 0.35);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.1);
}

.vault-security-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.45);
    color: #fca5a5;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.14em;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    margin-bottom: 12px;
}

.vault-led-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ef4444;
    box-shadow: 0 0 8px #ef4444;
    animation: blinkDot 1.2s infinite alternate;
}

.vault-keyhole-icon {
    font-size: 42px;
    margin-bottom: 8px;
    filter: drop-shadow(0 4px 14px rgba(245, 158, 11, 0.35));
}

.admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

@media (max-width: 600px) {
    .admin-stats-grid {
        grid-template-columns: 1fr;
    }
}

.stat-card {
    background: linear-gradient(180deg, #151928 0%, #0e121d 100%);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
}

.stat-card.active-stat {
    border-color: rgba(16, 185, 129, 0.4);
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, #0e121d 100%);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.12);
}

.stat-card.trash-stat {
    border-color: rgba(245, 158, 11, 0.45);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, #0e121d 100%);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.12);
}

.stat-num {
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1.1;
    font-family: monospace;
}

.stat-label {
    font-size: 11px;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.02em;
}

.admin-tabs-nav {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 10px;
    margin-bottom: 14px;
    overflow-x: auto;
}

.admin-tab-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    padding: 8px 16px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: var(--transition);
    white-space: nowrap;
}

.admin-tab-btn:hover {
    color: var(--text-pure);
    background: rgba(255, 255, 255, 0.06);
}

.admin-tab-btn.active {
    background: var(--bg-surface-elevated);
    border-color: var(--border-card);
    color: #ffffff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.admin-tab-btn .tab-badge {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-body);
    font-size: 10px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
}

.admin-tab-btn.active .tab-badge {
    background: var(--brand-amber);
    color: #000000;
}

.admin-alert-banner {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #fde68a;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 11.5px;
    line-height: 1.55;
    margin-bottom: 16px;
}

.admin-media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
}

.admin-media-card {
    background: linear-gradient(180deg, #131724 0%, #0d101a 100%);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
}

.admin-media-card:hover {
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px);
}

.admin-media-card.is-deleted {
    border-color: rgba(245, 158, 11, 0.55);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, #0d101a 100%);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.12);
}

.admin-media-thumb-box {
    background: radial-gradient(circle at 50% 50%, #111420 0%, #06080e 100%);
    padding: 12px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 185px;
    position: relative;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}"""

admin_new = """.admin-vault-card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.06);
}

.vault-security-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.14em;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    margin-bottom: 12px;
}

.vault-led-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ef4444;
    box-shadow: 0 0 8px #ef4444;
    animation: blinkDot 1.2s infinite alternate;
}

.vault-keyhole-icon {
    font-size: 42px;
    margin-bottom: 8px;
    filter: drop-shadow(0 4px 14px rgba(245, 158, 11, 0.25));
}

.admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

@media (max-width: 600px) {
    .admin-stats-grid {
        grid-template-columns: 1fr;
    }
}

.stat-card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;
    overflow: hidden;
}

.stat-card.active-stat {
    border-color: #bbf7d0;
    background: #f0fdf4;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
}

.stat-card.trash-stat {
    border-color: #fde68a;
    background: #fffbeb;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.08);
}

.stat-num {
    font-size: 28px;
    font-weight: 900;
    color: #000000;
    line-height: 1.1;
    font-family: monospace;
}

.stat-label {
    font-size: 11px;
    font-weight: 800;
    color: #6b7280;
    letter-spacing: 0.02em;
}

.admin-tabs-nav {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 10px;
    margin-bottom: 14px;
    overflow-x: auto;
}

.admin-tab-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #4b5563;
    padding: 8px 16px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: var(--transition);
    white-space: nowrap;
}

.admin-tab-btn:hover {
    color: #000000;
    background: #f3f4f6;
}

.admin-tab-btn.active {
    background: #000000;
    border-color: #000000;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.admin-tab-btn .tab-badge {
    background: #e5e7eb;
    color: #374151;
    font-size: 10px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
}

.admin-tab-btn.active .tab-badge {
    background: #ffffff;
    color: #000000;
}

.admin-alert-banner {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    line-height: 1.55;
    margin-bottom: 16px;
}

.admin-media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
}

.admin-media-card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: var(--transition);
}

.admin-media-card:hover {
    border-color: #000000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.admin-media-card.is-deleted {
    border-color: #f59e0b;
    background: #fffdf5;
}

.admin-media-thumb-box {
    background: #f9fafb;
    padding: 12px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 185px;
    position: relative;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
}"""

assert admin_old in css, "admin_old not found!"
css = css.replace(admin_old, admin_new)

# 11. Update Admin Frame Cards & Curation Control
admin_frames_old = """.admin-frame-card {
    background: linear-gradient(180deg, #131724 0%, #0d101a 100%);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    transition: var(--transition);
}

.admin-frame-card:hover {
    border-color: rgba(244, 63, 94, 0.55);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 15px rgba(244, 63, 94, 0.15);
}

.admin-frame-thumb-box {
    background: radial-gradient(circle at 50% 50%, #111420 0%, #06080d 100%);
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 175px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    overflow: hidden;
}"""

admin_frames_new = """.admin-frame-card {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: var(--radius-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: var(--transition);
}

.admin-frame-card:hover {
    border-color: #000000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.admin-frame-thumb-box {
    background: #f9fafb;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 175px;
    border-bottom: 1px solid #f3f4f6;
    position: relative;
    overflow: hidden;
}"""

assert admin_frames_old in css, "admin_frames_old not found!"
css = css.replace(admin_frames_old, admin_frames_new)

# 12. Update curation control box & footer
curation_old = """.curation-control-box {
    border-radius: var(--radius-md);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

.curation-tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 11.5px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: var(--transition);
    font-family: inherit;
}

.curation-tab-btn:hover {
    color: var(--text-pure);
    background: rgba(255, 255, 255, 0.08);
}

.curation-tab-btn.active {
    background: linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(245, 158, 11, 0.28) 100%);
    color: #ffffff;
    box-shadow: 0 2px 10px rgba(244, 63, 94, 0.3);
}"""

curation_new = """.curation-control-box {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.curation-tab-btn {
    background: transparent;
    border: none;
    color: #6b7280;
    font-size: 11.5px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: var(--transition);
    font-family: inherit;
}

.curation-tab-btn:hover {
    color: #000000;
    background: #f3f4f6;
}

.curation-tab-btn.active {
    background: #000000;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}"""

assert curation_old in css, "curation_old not found!"
css = css.replace(curation_old, curation_new)

# 13. Update footer
footer_old = """.app-footer {
    text-align: center;
    padding: 24px 16px;
    border-top: 1px solid var(--border-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    text-transform: uppercase;
}"""

footer_new = """.app-footer {
    text-align: center;
    padding: 24px 16px;
    background: #ffffff;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #6b7280;
    text-transform: uppercase;
}"""

if footer_old in css:
    css = css.replace(footer_old, footer_new)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Successfully updated style.css with harmonized light theme!")

