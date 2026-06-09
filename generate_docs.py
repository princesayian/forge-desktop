#!/usr/bin/env python3
import asyncio, os, time
from pathlib import Path
from playwright.async_api import async_playwright
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

BASE_URL = "http://127.0.0.1:7432"
OUT_DIR = Path("/tmp/forge_screenshots")
OUT_DIR.mkdir(exist_ok=True)
PDF_PATH = Path.home() / "Desktop" / "Superhero-Forge-v1.1-Overview.pdf"

TABS = [
    ("teams",    "Teams",        "#teams-tab"),
    ("roster",   "Roster",       "#roster-tab"),
    ("dynamics", "Team Dynamics","#dynamics-tab"),
    ("prompts",  "Image Prompts","#prompts-tab"),
    ("recruit",  "Recruit",      "#recruit-tab"),
    ("villains", "Villains",     "#villains-tab"),
    ("story",    "Story",        "#story-tab"),
    ("battle",   "Battle",       "#battle-tab"),
    ("arc",      "Arc",          "#arc-tab"),
    ("tiers",    "Tiers",        "#tiers-tab"),
    ("universe", "Universe Map", "#universe-tab"),
]

async def capture_screenshots():
    screenshots = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1500)

        for tab_id, label, selector in TABS:
            try:
                btn = await page.query_selector(selector)
                if btn:
                    await btn.click()
                    await page.wait_for_timeout(800)
                path = OUT_DIR / f"{tab_id}.png"
                await page.screenshot(path=str(path), full_page=False)
                screenshots[tab_id] = str(path)
                print(f"  captured: {label}")
            except Exception as e:
                print(f"  SKIP {label}: {e}")

        await browser.close()
    return screenshots

# ── Palette ──────────────────────────────────────────────────────────────────
NAVY     = colors.HexColor("#0f2044")
ACCENT   = colors.HexColor("#1e3a8a")
GOLD     = colors.HexColor("#b45309")
TEXT     = colors.HexColor("#111827")
SUBTEXT  = colors.HexColor("#374151")
MUTED    = colors.HexColor("#6b7280")
WHITE    = colors.white
LIGHT    = colors.HexColor("#f3f4f6")
RULE     = colors.HexColor("#d1d5db")

def build_pdf(screenshots):
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=0.6*inch, rightMargin=0.6*inch,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
    )

    W, _ = letter
    usable = W - 1.2*inch

    styles = getSampleStyleSheet()

    def style(name, **kw):
        s = ParagraphStyle(name, **kw)
        return s

    h1  = style("H1",  fontSize=30, textColor=NAVY,    spaceAfter=6,  alignment=TA_CENTER, fontName="Helvetica-Bold")
    h2  = style("H2",  fontSize=16, textColor=NAVY,    spaceAfter=4,  spaceBefore=14, fontName="Helvetica-Bold")
    h3  = style("H3",  fontSize=12, textColor=ACCENT,  spaceAfter=3,  spaceBefore=10, fontName="Helvetica-Bold")
    body= style("Body",fontSize=10, textColor=TEXT,    spaceAfter=4,  leading=16, fontName="Helvetica")
    sub = style("Sub", fontSize=9,  textColor=SUBTEXT, spaceAfter=3,  leading=14, fontName="Helvetica")
    cap = style("Cap", fontSize=9,  textColor=MUTED,   spaceAfter=6,  alignment=TA_CENTER, fontName="Helvetica-Oblique")

    story = []

    def hr(color=RULE, thickness=0.75):
        return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=8, spaceBefore=4)

    # ── Cover ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.2*inch))
    story.append(Paragraph("NOCTURNAL INNOVATIONS'S SUPERHERO FORGE", h1))
    story.append(Paragraph("v1.1 — Feature Overview &amp; Changelog", style("sub2", fontSize=14, textColor=GOLD, alignment=TA_CENTER, fontName="Helvetica-Bold")))
    story.append(Spacer(1, 0.15*inch))
    story.append(hr(NAVY, 1.5))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        "Local AI-powered superhero universe builder. No API keys. No subscriptions. "
        "Runs entirely on-device via Ollama.",
        style("coverSub", fontSize=11, textColor=SUBTEXT, alignment=TA_CENTER, fontName="Helvetica")
    ))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph(f"Generated: {time.strftime('%B %d, %Y')}", cap))
    story.append(PageBreak())

    # ── Changelog table ──────────────────────────────────────────────────────
    story.append(Paragraph("Changelog", h2))
    story.append(hr())

    changelog_data = [
        ["Version", "Area", "Change"],
        ["v1.0", "Core", "Multi-team system, NK core roster, roster image upload"],
        ["v1.0", "Core", "Character EditPanel, Team Dynamics SVG graph"],
        ["v1.0", "Core", "Image Prompts (Meta AI + Tripo3D), Recruit AI quiz"],
        ["v1.0", "Core", "Villains pool quiz, Story scene generator"],
        ["v1.0", "Core", "PDF dossier export, Ollama model selector, dark/light mode"],
        ["v1.1", "Infra", "macOS .app bundle (no terminal, background launch)"],
        ["v1.1", "Infra", "Single-instance PID lock with tkinter warning"],
        ["v1.1", "Infra", "Ollama auto-start on launch"],
        ["v1.1", "Infra", "Git auto-update check + one-click pull on launch"],
        ["v1.1", "Infra", "SSH key auth for GitHub remote"],
        ["v1.1", "Images", "Server-side image storage (disk persistence, not blob URLs)"],
        ["v1.1", "Roster", "Remove any member (core + custom), hero→villain flip"],
        ["v1.1", "Roster", "Switch teams inline, villain recruit back to team"],
        ["v1.1", "Remote", "Cloudflared tunnel — public HTTPS URL, zero router config"],
        ["v1.1", "Remote", "DuckDNS background updater for persistent domain"],
        ["v1.1", "Remote", "PIN authentication for non-local requests"],
        ["v1.1", "Tabs",   "⚡ Battle — AI-narrated 2-fighter battle with stat edges"],
        ["v1.1", "Tabs",   "Arc — Full multi-issue story arc generator"],
        ["v1.1", "Tabs",   "Tiers — S/A/B/C auto-rank by stats, manual override"],
        ["v1.1", "Tabs",   "Universe Map — SVG team orbits, relationship lines, avatars"],
        ["v1.1", "Version","FORGE_VERSION 1.1, header badge, /health endpoint"],
    ]

    col_w = [0.55*inch, 0.85*inch, usable - 1.4*inch]
    tbl = Table(changelog_data, colWidths=col_w, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0),  NAVY),
        ("TEXTCOLOR",     (0,0), (-1,0),  WHITE),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0),  9.5),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,1), (-1,-1), 9),
        ("TEXTCOLOR",     (0,1), (-1,-1), TEXT),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT]),
        ("GRID",          (0,0), (-1,-1), 0.5, RULE),
        ("LINEBELOW",     (0,0), (-1,0),  1,   NAVY),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
    ]))
    story.append(tbl)
    story.append(PageBreak())

    # ── Functionality list ────────────────────────────────────────────────────
    story.append(Paragraph("Full Functionality", h2))
    story.append(hr())

    features = [
        ("Teams", [
            "Create, rename, and delete custom hero teams",
            "Teams are fully custom — create any number of hero teams",
            "Each team has its own roster managed independently",
        ]),
        ("Roster", [
            "View all members of the selected team",
            "Upload a portrait image per character (persisted to disk)",
            "Remove any member — core members go to a removed list, custom deleted",
            "Switch any member to another team via inline panel",
            "Flip a hero to villain status (moves to Villain Pool)",
        ]),
        ("Team Dynamics", [
            "SVG connection graph for team internal relationships",
            "Edges colored by relationship type (ally, rival, mentor, etc.)",
        ]),
        ("Image Prompts", [
            "Per-character Meta AI art prompt (portrait style)",
            "Per-character Tripo3D 3D model prompt",
            "Group shot prompt for the full team",
        ]),
        ("Recruit (AI Quiz)", [
            "Standard mode: answer questions, AI generates a new hero",
            "Deep Lore mode: 7-phase narrative origin questionnaire",
            "Generated hero added directly to selected team",
        ]),
        ("Villains", [
            "Villain pool — separate from team rosters",
            "Create villains via AI quiz with antagonist framing",
            "Recruit any villain back to a hero team via inline panel",
        ]),
        ("Story", [
            "AI scene/mission generator with tone, location, and team selection",
            "Crossover support — pick members from multiple teams",
        ]),
        ("⚡ Battle", [
            "Pick any two fighters (heroes or villains)",
            "AI generates winner, battle narrative, and stat edge breakdown",
        ]),
        ("Arc", [
            "Title, main villain, participating teams, tone, and issue count",
            "AI generates full issue-by-issue arc with cliffhangers",
        ]),
        ("Tiers", [
            "Auto-ranks all heroes S/A/B/C by average stat score",
            "Click any member to manually cycle their tier",
            "Tier overrides persisted in localStorage",
        ]),
        ("Universe Map", [
            "SVG visualization of all teams and their alignment relationships",
            "Relationship lines colored by NK alignment",
            "Member avatar images rendered on the map",
        ]),
        ("PDF Dossier Export", [
            "Per-character classified dossier PDF via ReportLab",
            "Includes stats, powers, origin, and uploaded portrait",
        ]),
        ("Remote Access", [
            "Cloudflared tunnel — instant public HTTPS URL, no router config",
            "DuckDNS integration for persistent custom domain",
            "PIN auth guards all non-local requests when remote is enabled",
            "Settings panel in app header (⚙ button)",
        ]),
        ("Updates", [
            "Git fetch on launch — gold badge if behind origin/main",
            "One-click pull updates the app in-place",
        ]),
        ("Infrastructure", [
            "macOS .app bundle — double-click launch, no terminal",
            "Ollama auto-started on launch if not already running",
            "Single-instance lock (PID file + tkinter warning dialog)",
            "Flask port 7432, PyWebView native window",
        ]),
    ]

    for tab_name, bullets in features:
        story.append(Paragraph(tab_name, h3))
        for b in bullets:
            story.append(Paragraph(f"• {b}", body))
        story.append(Spacer(1, 0.05*inch))

    story.append(PageBreak())

    # ── Screenshots ───────────────────────────────────────────────────────────
    story.append(Paragraph("Feature Screenshots", h2))
    story.append(hr())

    tab_labels = {t[0]: t[1] for t in TABS}

    for tab_id, label, _ in TABS:
        path = screenshots.get(tab_id)
        if not path or not os.path.exists(path):
            story.append(Paragraph(f"{label} — screenshot unavailable", sub))
            continue
        story.append(Paragraph(label, h3))
        img = Image(path, width=usable, height=usable * 0.65)
        story.append(img)
        story.append(Paragraph(f"Tab: {label}", cap))
        story.append(Spacer(1, 0.15*inch))

    doc.build(story)
    print(f"\nPDF saved: {PDF_PATH}")

async def main():
    print("Capturing screenshots...")
    shots = await capture_screenshots()
    print(f"\nBuilding PDF...")
    build_pdf(shots)

if __name__ == "__main__":
    asyncio.run(main())
