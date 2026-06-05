"""
Superhero Forge — Feature Documentation PDF Generator
Run: python3 make_docs.py
Output: Forge_Features.pdf (next to this script)
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Palette ──────────────────────────────────────────────────────────────────
BG       = colors.HexColor("#09090F")
CARD     = colors.HexColor("#0E0E1C")
GOLD     = colors.HexColor("#D4AF37")
GOLD_DIM = colors.HexColor("#8A6F1E")
VIOLET   = colors.HexColor("#534AB7")
TEAL     = colors.HexColor("#0F6E56")
RUST     = colors.HexColor("#993C1D")
BLUE     = colors.HexColor("#185FA5")
AMBER    = colors.HexColor("#BA7517")
TEXT1    = colors.HexColor("#F0EAD6")
TEXT2    = colors.HexColor("#B8B0A0")
TEXT3    = colors.HexColor("#807870")
WHITE    = colors.white
RED_DIM  = colors.HexColor("#8B1A1A")
TEAL_LT  = colors.HexColor("#5DCAA5")
GREEN    = colors.HexColor("#5DCAA5")

def hx(color):
    """Return 6-char lowercase hex string from a reportlab Color."""
    r = int(color.red * 255)
    g = int(color.green * 255)
    b = int(color.blue * 255)
    return f"{r:02x}{g:02x}{b:02x}"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Forge_Features.pdf")
W, H = letter

# ── Styles ───────────────────────────────────────────────────────────────────
def sty(name, font="Helvetica", size=10, color=TEXT1, leading=None,
        align=TA_LEFT, space_before=0, space_after=4, bold=False):
    return ParagraphStyle(
        name, fontName=f"Helvetica-{'Bold' if bold else 'Oblique' if font.endswith('Oblique') else 'Bold' if bold else ''}",
        fontSize=size, textColor=color,
        leading=leading or max(size + 4, 14),
        alignment=align, spaceBefore=space_before, spaceAfter=space_after
    )

S_COVER_TITLE = ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=42,
    textColor=GOLD, leading=50, alignment=TA_CENTER, spaceBefore=0, spaceAfter=6)
S_COVER_SUB   = ParagraphStyle("cs", fontName="Helvetica", fontSize=13,
    textColor=TEXT2, leading=18, alignment=TA_CENTER, spaceBefore=0, spaceAfter=4)
S_COVER_MONO  = ParagraphStyle("cm", fontName="Courier", fontSize=9,
    textColor=TEXT3, leading=13, alignment=TA_CENTER, spaceBefore=0, spaceAfter=2)
S_SECTION     = ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=18,
    textColor=GOLD, leading=24, alignment=TA_LEFT, spaceBefore=18, spaceAfter=8)
S_H2          = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12,
    textColor=TEXT1, leading=17, alignment=TA_LEFT, spaceBefore=10, spaceAfter=4)
S_H3          = ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=10,
    textColor=TEAL_LT, leading=15, alignment=TA_LEFT, spaceBefore=6, spaceAfter=3)
S_BODY        = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5,
    textColor=TEXT2, leading=15, alignment=TA_LEFT, spaceBefore=0, spaceAfter=4)
S_MONO        = ParagraphStyle("mono", fontName="Courier", fontSize=8.5,
    textColor=TEXT3, leading=13, alignment=TA_LEFT, spaceBefore=0, spaceAfter=3)
S_LABEL       = ParagraphStyle("lbl", fontName="Helvetica-Bold", fontSize=8,
    textColor=GOLD, leading=12, alignment=TA_LEFT, spaceBefore=0, spaceAfter=1)
S_BULLET      = ParagraphStyle("bul", fontName="Helvetica", fontSize=9.5,
    textColor=TEXT2, leading=15, leftIndent=14, firstLineIndent=-10,
    spaceBefore=0, spaceAfter=3)
S_SMALL       = ParagraphStyle("sm", fontName="Helvetica", fontSize=8,
    textColor=TEXT3, leading=12, alignment=TA_LEFT, spaceBefore=0, spaceAfter=2)
S_HERO_NAME   = ParagraphStyle("hn", fontName="Helvetica-Bold", fontSize=11,
    textColor=TEXT1, leading=15, spaceBefore=0, spaceAfter=1)
S_HERO_REAL   = ParagraphStyle("hr", fontName="Helvetica", fontSize=8.5,
    textColor=TEXT3, leading=12, spaceBefore=0, spaceAfter=1)
S_CL_TITLE    = ParagraphStyle("clt", fontName="Helvetica-Bold", fontSize=13,
    textColor=GOLD, leading=18, spaceBefore=10, spaceAfter=4)
S_CL_VERSION  = ParagraphStyle("clv", fontName="Courier-Bold", fontSize=9,
    textColor=TEAL_LT, leading=13, spaceBefore=6, spaceAfter=2)
S_CL_DATE     = ParagraphStyle("cld", fontName="Courier", fontSize=8,
    textColor=TEXT3, leading=12, spaceBefore=0, spaceAfter=3)
S_PAGE_LABEL  = ParagraphStyle("pl", fontName="Courier", fontSize=8,
    textColor=TEXT3, leading=12, alignment=TA_CENTER)

def hr(color=GOLD, thickness=0.5, space_before=6, space_after=10):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=space_after, spaceBefore=space_before)

def bullet(text, color=TEAL_LT):
    return Paragraph(f'<font color="#{hx(color)}" size="11">•</font>  {text}', S_BULLET)

def tag_row(tags, tag_color=VIOLET):
    """Render a row of coloured tag pills as a table."""
    hex_c = hx(tag_color)
    cells = []
    for t in tags:
        cells.append(Paragraph(
            f'<font color="#{hex_c}" size="7.5"><b> {t} </b></font>',
            ParagraphStyle("tag", fontName="Helvetica-Bold", fontSize=7.5,
                           textColor=tag_color, leading=11,
                           alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
        ))
    tbl = Table([cells], colWidths=[1.1*inch]*len(cells), rowHeights=[0.22*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor(f"#{hex_c}18")),
        ("BOX",        (0,0), (-1,-1), 0.5, tag_color),
        ("ROUNDEDCORNERS", [4]),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING",(0,0), (-1,-1), 6),
        ("RIGHTPADDING",(0,0),(-1,-1), 6),
    ]))
    return tbl

def feature_card(title, accent, body_paragraphs, tags=None):
    """A framed feature block."""
    inner = []
    inner.append(Paragraph(title.upper(), ParagraphStyle(
        "fc_title", fontName="Helvetica-Bold", fontSize=10,
        textColor=accent, leading=14, spaceBefore=0, spaceAfter=4,
        leftIndent=8
    )))
    for p in body_paragraphs:
        inner.append(p)
    if tags:
        tag_cells = [Paragraph(
            f'<font size="7" color="#{hx(accent)}"><b>{t}</b></font>',
            ParagraphStyle("ftag", fontName="Helvetica-Bold", fontSize=7,
                           textColor=accent, leading=10, alignment=TA_CENTER,
                           spaceBefore=0, spaceAfter=0)
        ) for t in tags]
        w = min(0.9*inch, 6.2*inch/len(tags))
        tag_tbl = Table([tag_cells], colWidths=[w]*len(tags), rowHeights=[0.18*inch])
        tag_tbl.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1),colors.HexColor(f"#{hx(accent)}18")),
            ("BOX",(0,0),(-1,-1),0.4,accent),
            ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
            ("LEFTPADDING",(0,0),(-1,-1),4),
            ("RIGHTPADDING",(0,0),(-1,-1),4),
        ]))
        inner.append(Spacer(1, 4))
        inner.append(tag_tbl)

    tbl = Table([[inner]], colWidths=[6.5*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), colors.HexColor(f"#{hx(accent)}08")),
        ("LINEAFTER", (0,0), (0,-1), 2, accent),
        ("TOPPADDING",(0,0),(-1,-1),8),
        ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),0),
        ("RIGHTPADDING",(0,0),(-1,-1),10),
    ]))
    return tbl

def two_col(left_items, right_items, col_w=3.2*inch):
    left_col  = [[item] for item in left_items]
    right_col = [[item] for item in right_items]
    tl = Table(left_col,  colWidths=[col_w])
    tr = Table(right_col, colWidths=[col_w])
    tl.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),6)]))
    tr.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),0)]))
    outer = Table([[tl, tr]], colWidths=[col_w+6, col_w+6])
    outer.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
                                ("LEFTPADDING",(0,0),(-1,-1),0),
                                ("RIGHTPADDING",(0,0),(-1,-1),0)]))
    return outer

# ── Page background ──────────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # Top accent bar
    canvas.setFillColor(GOLD)
    canvas.rect(0, H-3, W, 3, fill=1, stroke=0)
    # Bottom accent bar
    canvas.setFillColor(colors.HexColor("#D4AF3730"))
    canvas.rect(0, 0, W, 2, fill=1, stroke=0)
    # Footer text
    canvas.setFont("Courier", 7)
    canvas.setFillColor(TEXT3)
    canvas.drawCentredString(W/2, 20, f"SUPERHERO FORGE  ·  NOCTURNAL INC  ·  CLASSIFIED")
    canvas.restoreState()

# ── Document ─────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUT,
    pagesize=letter,
    leftMargin=0.85*inch,
    rightMargin=0.85*inch,
    topMargin=0.75*inch,
    bottomMargin=0.6*inch,
)

story = []

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COVER PAGE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Spacer(1, 1.4*inch))
story.append(Paragraph("SUPERHERO FORGE", S_COVER_TITLE))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("Feature Reference  ·  Nocturnal Knights Universe", S_COVER_SUB))
story.append(Spacer(1, 0.25*inch))

# Divider with accent boxes
div_data = [["", "", ""]]
div_tbl = Table(div_data, colWidths=[2.5*inch, 1.5*inch, 2.5*inch], rowHeights=[3])
div_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0),(0,0), TEXT3),
    ("BACKGROUND", (1,0),(1,0), GOLD),
    ("BACKGROUND", (2,0),(2,0), TEXT3),
    ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
]))
story.append(div_tbl)

story.append(Spacer(1, 0.3*inch))
story.append(Paragraph(
    "Local AI-powered character builder for the Nocturnal Knights universe.<br/>"
    "No subscriptions. No API keys required. Fully offline-capable.",
    ParagraphStyle("cover_body", fontName="Helvetica", fontSize=12,
                   textColor=TEXT2, leading=20, alignment=TA_CENTER)
))
story.append(Spacer(1, 0.5*inch))

# Core roster table
roster_data = [
    [Paragraph("<b>HERO NAME</b>", ParagraphStyle("rh",fontName="Helvetica-Bold",fontSize=8,textColor=GOLD,leading=11,alignment=TA_CENTER)),
     Paragraph("<b>REAL NAME</b>",  ParagraphStyle("rh",fontName="Helvetica-Bold",fontSize=8,textColor=GOLD,leading=11,alignment=TA_CENTER)),
     Paragraph("<b>ROLE</b>",       ParagraphStyle("rh",fontName="Helvetica-Bold",fontSize=8,textColor=GOLD,leading=11,alignment=TA_CENTER))],
    [Paragraph("Wakháŋ",      ParagraphStyle("rc",fontName="Helvetica-Bold",fontSize=9,textColor=colors.HexColor("#AFA9EC"),leading=13,alignment=TA_CENTER)),
     Paragraph("Kareem Carter",    ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT2,leading=13,alignment=TA_CENTER)),
     Paragraph("Leader · Powerhouse", ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT3,leading=13,alignment=TA_CENTER))],
    [Paragraph("Null/Void",        ParagraphStyle("rc",fontName="Helvetica-Bold",fontSize=9,textColor=TEAL_LT,leading=13,alignment=TA_CENTER)),
     Paragraph("Jon Bethea",       ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT2,leading=13,alignment=TA_CENTER)),
     Paragraph("2IC · Tech Striker",  ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT3,leading=13,alignment=TA_CENTER))],
    [Paragraph("Catalix",          ParagraphStyle("rc",fontName="Helvetica-Bold",fontSize=9,textColor=colors.HexColor("#F0997B"),leading=13,alignment=TA_CENTER)),
     Paragraph('Jesus "Omar" Fernandez', ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT2,leading=13,alignment=TA_CENTER)),
     Paragraph("Scientist · Brawler",   ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT3,leading=13,alignment=TA_CENTER))],
    [Paragraph("Bastion Prime",    ParagraphStyle("rc",fontName="Helvetica-Bold",fontSize=9,textColor=colors.HexColor("#5B9FE0"),leading=13,alignment=TA_CENTER)),
     Paragraph("Mario Richardson", ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT2,leading=13,alignment=TA_CENTER)),
     Paragraph("Heart · Clutch Factor", ParagraphStyle("rc",fontName="Helvetica",fontSize=9,textColor=TEXT3,leading=13,alignment=TA_CENTER))],
]
rt = Table(roster_data, colWidths=[1.8*inch, 2.0*inch, 2.7*inch])
rt.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0), colors.HexColor("#D4AF3718")),
    ("BACKGROUND",(0,1),(-1,1), colors.HexColor("#534AB712")),
    ("BACKGROUND",(0,2),(-1,2), colors.HexColor("#0F6E5612")),
    ("BACKGROUND",(0,3),(-1,3), colors.HexColor("#993C1D12")),
    ("BACKGROUND",(0,4),(-1,4), colors.HexColor("#185FA512")),
    ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#D4AF3740")),
    ("INNERGRID",(0,0),(-1,-1),0.3,colors.HexColor("#D4AF3720")),
    ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
    ("LEFTPADDING",(0,0),(-1,-1),10), ("RIGHTPADDING",(0,0),(-1,-1),10),
    ("ALIGN",(0,0),(-1,-1),"CENTER"), ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
]))
story.append(rt)

story.append(Spacer(1, 0.6*inch))
story.append(Paragraph("NOCTURNAL INC  ·  2026", S_COVER_MONO))
story.append(Paragraph("Forge Desktop  ·  Local AI  ·  Nocturnal Knights Universe Builder", S_COVER_MONO))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TABLE OF CONTENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("CONTENTS", S_SECTION))
story.append(hr())

toc_items = [
    ("01", "Teams",             "Create and manage multiple hero teams"),
    ("02", "Roster",            "Character cards, images, exports"),
    ("03", "Recruit",           "Three-mode AI character generator"),
    ("04", "Character Editor",  "Edit profile, stats, powers, ability type"),
    ("05", "Villains",          "Villain forge — targeted antagonists"),
    ("06", "Solo Heroes",       "Independent heroes with their own rogues"),
    ("07", "Team & Prompts",    "Constellation view, AI image & 3D prompts"),
    ("08", "Battle Engine",     "AI-simulated 1v1 combat"),
    ("09", "Arc Generator",     "Multi-issue story arcs"),
    ("10", "Family Web",        "Character relationship mapping"),
    ("11", "Tiers & Universe",  "Power rankings and universe overview"),
    ("12", "Race & Codex",      "Alien species lore and encyclopaedia"),
    ("13", "Remote Access",     "Cloudflare tunnel, DuckDNS, login + CAPTCHA"),
    ("14", "App System",        "Performance, caching, smart notifications"),
    ("CL", "Changelog",         "Major version history"),
]
for num, title, desc in toc_items:
    row_data = [[
        Paragraph(f'<font color="#{hx(GOLD)}">{num}</font>',
                  ParagraphStyle("tnum",fontName="Courier-Bold",fontSize=10,textColor=GOLD,leading=14,alignment=TA_RIGHT)),
        Paragraph(f'<b>{title}</b>',
                  ParagraphStyle("ttl",fontName="Helvetica-Bold",fontSize=10,textColor=TEXT1,leading=14,alignment=TA_LEFT)),
        Paragraph(desc,
                  ParagraphStyle("tdsc",fontName="Helvetica",fontSize=9,textColor=TEXT3,leading=14,alignment=TA_LEFT)),
    ]]
    row_tbl = Table(row_data, colWidths=[0.4*inch, 1.9*inch, 4.2*inch])
    row_tbl.setStyle(TableStyle([
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    story.append(row_tbl)
    story.append(hr(TEXT3, 0.3, 0, 2))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 01 — TEAMS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("01 — TEAMS", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "The Teams tab is the home screen and entry point. Every character, villain, story, and arc in the Forge belongs to a team. "
    "You can run any number of teams simultaneously — the Nocturnal Knights are pre-loaded, but you can create original teams for any concept.",
    S_BODY))
story.append(Spacer(1, 6))

story.append(KeepTogether([
    Paragraph("Creating a Team", S_H2),
    bullet("Name, abbreviation, and primary team color (12 palette choices or custom hex)"),
    bullet("Team type: Street Level, Urban, Regional, Global Threat, Cosmic, Government Agency, Underground, Legacy, Tech/Corporate, International, Vigilante Network"),
    bullet("Generated logo: 8 geometric styles that automatically inherit team color"),
    bullet("Custom logo upload: drag-and-drop replaces the generated icon everywhere in the app"),
    bullet("Team description, motto, and founding origin (optional narrative fields)"),
    bullet("NK Alignment: defines the team's relationship to the Nocturnal Knights — Allied, Rival, Enemy, Neutral, or Splinter Cell"),
    Spacer(1, 6),
]))

story.append(KeepTogether([
    Paragraph("Team Navigation", S_H2),
    bullet("Click any team card to activate it — all tabs (Roster, Recruit, Battle, etc.) then operate on that team"),
    bullet("Active team always shown in the header with color accent"),
    bullet("Tab bar remembers your last active tab across restarts"),
    Spacer(1, 6),
]))

story.append(KeepTogether([
    Paragraph("Team Types", S_H3),
    Spacer(1, 4),
]))
type_data = [
    ["Street Level", "City-scale vigilantes, ground-level threats"],
    ["Urban / City",  "Metropolitan operations, city-wide jurisdiction"],
    ["Regional / National", "Country-level incidents and government adjacency"],
    ["Global Threat", "Worldwide operations, multi-nation response teams"],
    ["Cosmic / Supernatural", "Off-world threats, mystical or dimensional scope"],
    ["Government Agency", "Sanctioned by state — resources vs. oversight"],
    ["Underground", "Black-market, criminal-adjacent, shadow operators"],
    ["Legacy Heroes", "Successor teams, inherited mantles and histories"],
    ["Tech / Corporate", "Lab-built heroes, corporate or industrial backing"],
    ["Vigilante Network", "Decentralized, grassroots, no hierarchy"],
]
type_tbl = Table(type_data, colWidths=[2.0*inch, 4.5*inch])
type_tbl.setStyle(TableStyle([
    ("BACKGROUND",(0,i),(-1,i), colors.HexColor("#534AB710" if i%2==0 else "#09090F")) for i in range(len(type_data))
] + [
    ("TEXTCOLOR",(0,0),(0,-1), colors.HexColor("#AFA9EC")),
    ("TEXTCOLOR",(1,0),(1,-1), TEXT2),
    ("FONTNAME",(0,0),(0,-1), "Helvetica-Bold"),
    ("FONTNAME",(1,0),(1,-1), "Helvetica"),
    ("FONTSIZE",(0,0),(-1,-1), 9),
    ("LEADING",(0,0),(-1,-1), 13),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LEFTPADDING",(0,0),(-1,-1),8),
    ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#534AB740")),
    ("INNERGRID",(0,0),(-1,-1),0.3,colors.HexColor("#534AB720")),
]))
story.append(type_tbl)
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 02 — ROSTER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("02 — ROSTER", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "The Roster is your team's visual command center. Every member is displayed as an image card — "
    "upload a portrait and the card transforms into a full character showcase.",
    S_BODY))
story.append(Spacer(1, 6))

left = [
    Paragraph("Image Cards", S_H2),
    bullet("Upload portrait: tap any empty card to upload (PNG, JPG, WEBP, GIF)"),
    bullet("↑ Change / ↓ Save buttons appear once an image is uploaded"),
    bullet("Expand a card to reveal the full character sheet beneath"),
    bullet("Edit button opens inline EditPanel without leaving the tab"),
    Spacer(1, 8),
    Paragraph("Character Sheet (expanded)", S_H2),
    bullet("Full-height portrait with gradient overlay and callout labels"),
    bullet("Callout labels pull from power/ability names (up to 3)"),
    bullet("DATA FILE block: affiliation, key strengths, profile, race, status"),
    bullet("Powers/Arsenal/Skills grid with descriptions"),
    bullet("Origin paragraph, stat bars, alignment badge, team rank badge"),
    bullet("Color scheme driven by each character's chosen accent color"),
]
right = [
    Paragraph("Exports", S_H2),
    bullet("⬇ Export PDF — full team PDF with every character sheet"),
    bullet("PNG Reference Sheet — artist-reference grid showing all members: portrait, hero name, real name, first two power names, color swatch, and power FX line"),
    bullet("⬇ Save Image — downloads individual character portrait"),
    Spacer(1, 8),
    Paragraph("3D Print Integration", S_H2),
    bullet("⬡ Tripo3D button appears once a portrait is uploaded"),
    bullet("Generates a 3D printing prompt optimized for FDM multi-filament: separate color regions, watertight mesh, heroic A-pose"),
    bullet("Copy the prompt and use directly in Tripo3D"),
    Spacer(1, 8),
    Paragraph("Team Rank Badges", S_H2),
    bullet("Leader, Second-in-Command, Veteran, Operative, Recruit, Reserve"),
    bullet("Each rank has a distinct icon and color — shown on character sheets and roster cards"),
]
story.append(two_col(left, right))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 03 — RECRUIT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("03 — RECRUIT", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "The Recruit tab contains the character generator — the core AI creation engine. "
    "Three distinct modes give you control over how deeply the AI knows the character before it builds them.",
    S_BODY))
story.append(Spacer(1, 8))

story.append(feature_card(
    "Mode 1 — Quick Forge",
    VIOLET,
    [Paragraph("Provide basic inputs and answer a short quiz. The AI picks 2–3 comic/anime DNA inspirations from your answers and bakes them invisibly into every output field — power names, tagline, and origin all carry the influence without ever name-dropping the source.", S_BODY),
     Spacer(1, 4),
     bullet("Inputs: real name, hero name (optional), gender, birth year or age, race, color palette, team alignment, team rank, story direction (optional)"),
     bullet("Quiz: 6 questions covering archetype, power style, personality, visual signature, costume philosophy, and FX texture"),
     bullet("DNA Foundation: AI derives 2–3 character inspirations from quiz answers and uses them as invisible anchors"),
     bullet("Outputs: hero name, tagline, role, origin, 4 powers with descriptions, stats, costume description, power FX, consistency notes"),
    ],
    tags=["QUICK", "QUIZ-DRIVEN", "DNA ANCHOR"]
))
story.append(Spacer(1, 8))

story.append(feature_card(
    "Mode 2 — Deep Forge (Lore Phases)",
    TEAL,
    [Paragraph("A structured multi-phase questionnaire that builds a full lore profile before the AI generates a single word. The result is a character with layered, specific identity — not a generic archetype.", S_BODY),
     Spacer(1, 4),
     bullet("Phase 1 — Core Identity: archetype, universe inspiration, key influence, power style"),
     bullet("Phase 2 — Visual Identity: costume philosophy, power FX aesthetic, color symbolism"),
     bullet("Phase 3 — Psychological Profile: core drive, wound, relationship to power, moral compass"),
     bullet("Phase 4 — Story Layer: origin type, role in team dynamic, long-arc direction"),
     bullet("DNA Foundation assembled from lore answers and fed as invisible anchors to generation"),
     bullet("Free-text visual references field for additional style notes"),
     bullet("All lore answers are saved with the character for future editing context"),
    ],
    tags=["DEEP LORE", "4 PHASES", "LAYERED IDENTITY"]
))
story.append(Spacer(1, 8))

story.append(feature_card(
    "Mode 3 — Personal Profile",
    AMBER,
    [Paragraph("25 questions that map a real person's psychological profile. Every power, origin, and trait is derived from who that specific person actually is — not from archetype defaults. Built for founders who want to put real people in the universe.", S_BODY),
     Spacer(1, 4),
     bullet("Questions cover: core strengths, deepest wound, proving ground, what they protect, how they move through conflict, leadership style, relationship to rules, and more"),
     bullet("Power names are traceable to specific profile traits — not generic archetypes"),
     bullet("Origin reflects the real emotional core — the wound and what it became"),
     bullet("Costume and FX derived from identity and symbolism answers, not aesthetics alone"),
    ],
    tags=["25 QUESTIONS", "REAL PERSON", "PSYCHOGRAPHIC"]
))
story.append(Spacer(1, 8))

story.append(Paragraph("Race / Species Selection", S_H2))
story.append(Paragraph(
    "Every character has a race that shapes their origin and power logic. The AI receives race lore alongside the prompt — "
    "powers and backstory are automatically rooted in the character's biological heritage.",
    S_BODY))

race_data = [
    ["Human",           "Standard — power from training, gear, or modification only"],
    ["Enhanced Human",  "Biologically upgraded — serum, experiment, or gene therapy"],
    ["Cybernetic Human","Tech fused to the body — part machine, navigating dual identity"],
    ["A-Gene Mutate",   "Dormant aggression gene activated under extreme stress — power in the blood"],
    ["Experiment Mutate","Deliberately altered by outside forces — test subject turned identity"],
    ["Accident Mutate", "Unplanned event rewrote biology — disaster became origin"],
    ["Zyrenian (Alien)","Battle-bred warrior race — power scales with combat experience"],
    ["Auranthi (Alien)", "Solar-absorbing species — carries civilization archive in their DNA"],
    ["Dravosi (Alien)",  "40,000 years of selective breeding — biological peak performance"],
    ["Hybrid",          "Mixed heritage — two bloodlines combined into something entirely new"],
]
rd = Table(race_data, colWidths=[1.8*inch, 4.7*inch])
rd.setStyle(TableStyle([
    ("BACKGROUND",(0,i),(-1,i), colors.HexColor("#0F6E5610" if i%2==0 else "#09090F")) for i in range(len(race_data))
] + [
    ("TEXTCOLOR",(0,0),(0,-1), TEAL_LT),
    ("TEXTCOLOR",(1,0),(1,-1), TEXT2),
    ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),
    ("FONTNAME",(1,0),(1,-1),"Helvetica"),
    ("FONTSIZE",(0,0),(-1,-1),9),("LEADING",(0,0),(-1,-1),13),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LEFTPADDING",(0,0),(-1,-1),8),
    ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#0F6E5640")),
    ("INNERGRID",(0,0),(-1,-1),0.3,colors.HexColor("#0F6E5620")),
]))
story.append(rd)

story.append(Paragraph("Additional Recruit Fields", S_H2))
story.append(two_col(
    [bullet("Family tie: link to an existing character — specify as parent, sibling, child, cousin, or mentor"),
     bullet("Hero association: link to another hero — sidekick, partner, legacy ally, or parallel version"),
     bullet("Story direction: optional free-text field to anchor the generated origin around a specific event or theme"),
    ],
    [bullet("Hero name lock: pre-set the hero name before generation — AI uses it exactly"),
     bullet("Existing names awareness: AI always receives the list of names already on the roster to avoid duplicates"),
     bullet("Team rank pre-set: assign rank before generation so the character feels right for their role"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 04 — CHARACTER EDITOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("04 — CHARACTER EDITOR", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "Every character can be edited at any time. The editor opens inline below the character card "
    "and covers every field — identity, narrative, stats, and the full power set.",
    S_BODY))
story.append(Spacer(1, 6))

left = [
    Paragraph("Identity Fields", S_H2),
    bullet("Hero name, real name"),
    bullet("Gender, birth year (auto-calculates age), age override"),
    bullet("Race / species via hierarchical selector"),
    bullet("Tagline — the character's defining one-liner"),
    Spacer(1, 8),
    Paragraph("Narrative Fields", S_H2),
    bullet("Origin story with optional AI regeneration"),
    bullet("Story direction field: shape AI regeneration toward a specific event or theme"),
    bullet("↺ Regenerate from Race — rewrites the origin through the character's racial biology and history"),
    Spacer(1, 8),
    Paragraph("Classification", S_H2),
    bullet("Team Rank: Leader, Second-in-Command, Veteran, Operative, Recruit, Reserve"),
    bullet("Team Alignment: Member, Allied, Rival, Enemy, Neutral, Splinter Cell"),
    bullet("Hero Type: Hero, Anti-Hero, Reluctant Hero (heroes only)"),
]
right = [
    Paragraph("Ability Type", S_H2),
    bullet("Powers — innate superpowers, mutations, alien biology"),
    bullet("Arsenal — gadgets, tech, weapons (Batman / Iron Man type)"),
    bullet("Skills — peak-human training, martial arts, discipline-based abilities"),
    Paragraph("Drives the section label and input placeholders throughout the character sheet — no structural change to the data.", S_SMALL),
    Spacer(1, 8),
    Paragraph("Power Set Editor", S_H2),
    bullet("Edit any power name and description inline"),
    bullet("+ Add button appends a new blank power slot"),
    bullet("× button removes any individual power"),
    bullet("Powers can be renamed, cleared, or entirely replaced — supports character evolution and power loss arcs"),
    Spacer(1, 8),
    Paragraph("Stats", S_H2),
    bullet("Five stats: Power, Speed, Tech, Intellect, Will"),
    bullet("Range 1–100 with clamped number inputs"),
    bullet("Rendered as horizontal stat bars on the character sheet"),
]
story.append(two_col(left, right))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 05 — VILLAINS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("05 — VILLAINS", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "Villains are built to be narrative counterweights — every generation prompt explicitly targets the selected team "
    "so powers, origins, and motivations are built to oppose specific heroes.",
    S_BODY))
story.append(Spacer(1, 6))

story.append(Paragraph("Target System", S_H2))
story.append(Paragraph(
    "A villain can target one or more teams. The AI receives the hero roster by name when generating, "
    "producing powers that mirror or counter specific hero abilities. Villains appear across the Villains tab, "
    "Battle engine, Arc generator, and Universe view.", S_BODY))
story.append(Spacer(1, 6))

story.append(Paragraph("Three Generation Modes (mirrors Recruit)", S_H2))
story.append(two_col(
    [bullet("Quick: 6-question quiz with villain-specific framing — archetype becomes threat, drive becomes destructive motivation"),
     bullet("Deep Lore: same 4-phase questionnaire as Recruit but every answer is interpreted through a villain lens — visual identity becomes menacing presence"),
    ],
    [bullet("Personal Profile: 25-question psychological profile, interpreted as darkness — strengths become weapons, wounds become motivations"),
     bullet("All three modes require a target team selection and support name, gender, and story direction inputs"),
    ]
))
story.append(Spacer(1, 6))

story.append(Paragraph("Villain Character Sheet", S_H2))
story.append(Paragraph(
    'Villain sheets use a crimson classification theme: "HIGH PRIORITY THREAT" header, classified imagery, '
    'and red accent bars. They include the same full data: powers, origin, stats, DNA, and image upload.',
    S_BODY))
story.append(Paragraph(
    "Villain AI Image Prompt generation is also available — generates a Midjourney prompt that emphasizes menace, "
    "darkness, and malevolence in the visual description.",
    S_BODY))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 06 — SOLO HEROES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("06 — SOLO HEROES", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "The Codex tab's Solo Heroes section creates independent characters with no team affiliation. "
    "Solo heroes operate with personal missions, personal rogues galleries, and their own story arcs.",
    S_BODY))
story.append(Spacer(1, 6))

left = [
    Paragraph("Creation Modes", S_H2),
    bullet("Quick Forge: quiz-driven, same 3 modes as Recruit — but prompts explicitly enforce solo framing, no team dependency"),
    bullet("Deep Forge: full 4-phase lore profile, solo-specific generation context"),
    bullet("Personal Profile: 25-question psychological derivation, generates a hero rooted in who the person actually is"),
    Spacer(1, 8),
    Paragraph("Profile View", S_H2),
    bullet("Full character sheet identical to team heroes"),
    bullet("Portrait upload and all editor fields available"),
    bullet("AI image prompt generation (Midjourney format)"),
    bullet("Tripo3D 3D print prompt generation"),
]
right = [
    Paragraph("Rogues Gallery", S_H2),
    bullet("Each solo hero maintains their own rogues gallery"),
    bullet("Any villain that targets a team the hero belongs to (or is manually linked) appears here"),
    bullet("Rogues are shown with their powers, role, and origin — designed as direct antagonists to the solo hero"),
    Spacer(1, 8),
    Paragraph("Solo Story", S_H2),
    bullet("AI-generates a narrative short arc featuring the solo hero and their rogues"),
    bullet("Story context pulls the hero's origin, powers, tagline, and rogues into a cohesive narrative"),
    bullet("Copy button for export to any writing tool"),
]
story.append(two_col(left, right))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 07 — TEAM & PROMPTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("07 — TEAM VIEW & PROMPTS", S_SECTION))
story.append(hr())

story.append(Paragraph("Team Tab — Constellation View", S_H2))
story.append(Paragraph(
    "A visual node map where each hero is placed at a calculated position around the team center. "
    "Uploaded portraits appear in circular clips. Team logo shown at the center.",
    S_BODY))
story.append(two_col(
    [bullet("Click any node to select a member and see their condensed profile"),
     bullet("Team logo displayed at the center — uses uploaded logo if available"),
     bullet("Relationship lines drawn between characters with defined family or association ties"),
     bullet("Character stat summary and power list on selection"),
    ],
    [bullet("Team power overview: aggregate stat comparison across all members"),
     bullet("Alignment breakdown: counts of Member, Allied, Rival, Enemy, Neutral across the roster"),
     bullet("AI team-wide battle weakness analysis available from this view"),
     bullet("DNA anchor display: the comic/anime inspirations behind each generated character"),
    ]
))
story.append(Spacer(1, 10))

story.append(Paragraph("Prompts Tab — AI Image Generation", S_H2))
story.append(Paragraph(
    "Generates Midjourney-formatted prompts for hero portraits, group shots, and duo shots. "
    "Every prompt is color-accurate (no hex codes — all colors named), pose-specific, and locked to the character's consistency notes.",
    S_BODY))
story.append(two_col(
    [Paragraph("Individual Portraits", S_H3),
     bullet("Full prompt with: hero name, physique, exact costume detail, power FX actively firing, specific nighttime environment, rim lighting"),
     bullet("Age stage modifier: child, teen, young adult, middle-aged, elder — body proportions adjust"),
     bullet("--ar 2:3 --v 6.1 --style raw format with --q 2 flag"),
     Spacer(1, 6),
     Paragraph("Villain Portraits", S_H3),
     bullet("Same format but all descriptors emphasize menace, darkness, and malevolence"),
     bullet("Hardcoded visual framing: NOT heroic — all lighting and pose choices communicate threat"),
    ],
    [Paragraph("Group Shots", S_H3),
     bullet("Wide cinematic group shot — all members in dynamic heroic poses"),
     bullet("Attaches character reference sheet image to the prompt so AI is instructed to match existing designs"),
     bullet("Style selector: photorealistic, comic book, noir, anime"),
     Spacer(1, 6),
     Paragraph("Duo Shots", S_H3),
     bullet("Select any two characters — generates a paired duo composition"),
     bullet("Characters positioned left/right, facing slightly inward"),
     bullet("Reference sheet attached to lock in both character designs"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 08 — BATTLE ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("08 — BATTLE ENGINE", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "Simulate a 1v1 matchup between any two characters in the universe — hero vs. hero, hero vs. villain, "
    "villain vs. villain. The AI analyses powers, stats, DNA anchors, and origin to produce a full cinematic fight narrative.",
    S_BODY))
story.append(Spacer(1, 6))

story.append(two_col(
    [Paragraph("Fight Output", S_H2),
     bullet("Winner with margin: Narrow, Decisive, or Overwhelming"),
     bullet("Fighter A advantages — 2 specific edge points"),
     bullet("Fighter B advantages — 2 specific edge points"),
     bullet("Key Moment — one dramatic turning-point sentence"),
     bullet("Fight Narrative — 3–4 cinematic sentences"),
     bullet("Finisher — single finishing-move sentence"),
    ],
    [Paragraph("Character Context Injected", S_H2),
     bullet("Full power list with names"),
     bullet("All five stats (Power, Speed, Tech, Intellect, Will)"),
     bullet("DNA inspirations — influences the fight style and finishing move"),
     bullet("Origin summary — shapes the psychological dimension of the fight"),
     Spacer(1, 8),
     Paragraph("Copy Button", S_H2),
     bullet("One-click copy of narrative + key moment + finisher as plain text"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 09 — ARC GENERATOR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("09 — ARC GENERATOR", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "Generates a full multi-issue story arc for one or more teams. "
    "Every hero and villain in the selected teams is fed into the prompt as named cast members, "
    "producing a story that uses everyone meaningfully.",
    S_BODY))
story.append(Spacer(1, 6))

story.append(two_col(
    [Paragraph("Arc Inputs", S_H2),
     bullet("Team selection: single team or multi-team crossover"),
     bullet("Villain selection: choose which existing villains appear in the arc"),
     bullet("Issue count: 3 to 8 issues"),
     bullet("Arc direction: optional free-text to anchor the story theme"),
    ],
    [Paragraph("Arc Output", S_H2),
     bullet("Arc title and series tagline"),
     bullet("Per-issue breakdown: issue number, title, summary paragraph, cliffhanger"),
     bullet("Resolution summary tying all threads together"),
     bullet("Copy Arc button — exports the full arc as formatted plain text"),
    ]
))

story.append(Paragraph("Story Tab", S_H2))
story.append(Paragraph(
    "A lighter single-scene story generator. Select a cast from the active team, optionally include villains, "
    "and generate a short narrative scene rather than a full arc structure. "
    "Useful for quick lore posts, character spotlights, and social content.",
    S_BODY))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 10 — FAMILY WEB
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("10 — FAMILY WEB", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "A visual relationship map drawn as an SVG node graph. "
    "Characters are placed as nodes with their portraits or initials, "
    "and edges represent the relationships defined during creation.",
    S_BODY))
story.append(Spacer(1, 6))

story.append(two_col(
    [Paragraph("Relationship Types", S_H2),
     bullet("Family: parent, sibling, child, cousin"),
     bullet("Hero Association: sidekick, partner, legacy ally, parallel version, mentor"),
     bullet("Relationships are bidirectional — linking A to B also shows B to A"),
    ],
    [Paragraph("Interaction", S_H2),
     bullet("Click any node to see the character's brief profile"),
     bullet("Portraits appear in circular clips when uploaded"),
     bullet("Nodes use each character's accent color for the outline"),
     bullet("Edge lines colored to indicate relationship type"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 11 — TIERS & UNIVERSE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("11 — TIERS & UNIVERSE", S_SECTION))
story.append(hr())

story.append(Paragraph("Tiers Tab", S_H2))
story.append(Paragraph(
    "Ranks every character across all teams by overall power — calculated from their five stat scores. "
    "Characters are grouped into tiers (S, A, B, C) with portraits, stat totals, and team affiliation. "
    "Villains are included alongside heroes for a cross-universe power view.",
    S_BODY))
story.append(Spacer(1, 8))

story.append(Paragraph("Universe Tab", S_H2))
story.append(Paragraph(
    "A top-level view of the entire universe at once. "
    "All teams are shown with their full rosters, alignment relationships, and inter-team connection lines. "
    "The view scales to however many teams exist in the build.",
    S_BODY))
story.append(two_col(
    [bullet("All teams displayed simultaneously in a multi-node layout"),
     bullet("Team logos (uploaded or generated) at each team node"),
     bullet("Character portraits in orbital positions around each team"),
    ],
    [bullet("Alignment edges drawn between teams: Allied (teal), Rival (amber), Enemy (red)"),
     bullet("Villain nodes shown separately with their target connections"),
     bullet("Click any node to get the character/team summary"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 12 — RACE & CODEX
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("12 — RACE SYSTEM & CODEX", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "The Codex tab is the in-universe encyclopaedia. Every alien race has a full entry — homeworld history, "
    "biology, culture, powers, and lore notes written from within the NK universe. "
    "This lore is the same content injected into AI prompts when generating characters of each race.",
    S_BODY))
story.append(Spacer(1, 8))

for race_name, color, data in [
    ("ZYRENIAN", colors.HexColor("#8B3A3A"), {
        "Homeworld": "Zyrak (destroyed) — high-gravity volcanic world, 12 warring clans, uninhabitable for 2 centuries",
        "Core Biology": "Bloodline Response — surviving near-death combat permanently raises the power ceiling. Combat is biological fuel; atrophy is real without conflict stimulus.",
        "Culture": "No word for surrender. Deep clan loyalty earned only through proven capability. Absolute and lifelong once given.",
        "Powers": "Scaling strength ceiling · accelerated regeneration · structural durability · combat-instinct neural processing",
        "NK Note": "Displaced Zyrenians are mercenaries or soldiers searching for something worth fighting for. Finding a cause redirects their full biology toward it.",
    }),
    ("AURANTHI", colors.HexColor("#B87333"), {
        "Homeworld": "Aureth Prime (destroyed) — twin-sun world, 40,000-year civilization, ended by a natural spectral shift in the suns — no enemy, just physics",
        "Core Biology": "Biological solar cells. Yellow or blue-white stars trigger solar saturation. Civilizational archive of Aureth Prime encoded in DNA — speaks through them as intuition.",
        "Culture": "Understand on a cellular level that civilization is temporary. Protect what they love with everything. Restraint is philosophy, not weakness.",
        "Powers": "Solar saturation — flight · enhanced strength and speed · cellular regeneration · solar energy projection. Scales with star proximity.",
        "NK Note": "Auranthi restraint is earned. They have seen what power without purpose becomes.",
    }),
    ("DRAVOSI", colors.HexColor("#4A3F8B"), {
        "Homeworld": "Dravoss — capital of the 40-star-system Dravosi Supremacy, expanding for 8 millennia",
        "Core Biology": "40,000 years of deliberate selective breeding. Dense cellular structure, eliminated disease susceptibility, 400–600 year lifespan, minimal aging past 30. Can survive brief vacuum.",
        "Culture": "One axiom: the capable govern the rest. Voluntary weakness is a social transgression. They subjugate but maintain infrastructure — they cannot understand why that is insufficient.",
        "Powers": "Peak biological performance — no exotic powers. Strength, speed, durability at the functional limit of biological life. Rapid cellular repair.",
        "NK Note": "Dravosi exiles have all the capability and none of the Supremacy behind them. Either proving something, or deciding the Supremacy was wrong.",
    }),
]:
    story.append(KeepTogether([
        Paragraph(race_name, ParagraphStyle("rn",fontName="Helvetica-Bold",fontSize=11,
            textColor=color,leading=16,spaceBefore=8,spaceAfter=4)),
        Table(list([[
            Paragraph(f'<b><font color="#{hx(color)}">{k}: </font></b><font color="#{hx(TEXT2)}">{v}</font>',
                      ParagraphStyle("re",fontName="Helvetica",fontSize=8.5,textColor=TEXT2,leading=13))
        ]] for k,v in data.items()),
        colWidths=[6.5*inch]),
    ]))
    story.append(Spacer(1, 4))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 13 — REMOTE ACCESS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("13 — REMOTE ACCESS", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "The Forge can be shared with collaborators over the internet without any cloud accounts. "
    "Remote access is disabled by default — all local access is always unrestricted.",
    S_BODY))
story.append(Spacer(1, 6))

story.append(two_col(
    [Paragraph("Cloudflare Tunnel", S_H2),
     bullet("Requires cloudflared installed (Mac: brew install cloudflared · Windows: winget install cloudflare.cloudflared)"),
     bullet("When remote access is enabled, Forge starts a cloudflared tunnel automatically at startup"),
     bullet("Generates a public HTTPS URL — no port forwarding, no firewall config"),
     bullet("URL shown in the Remote Access panel and copied with one click"),
     Spacer(1, 8),
     Paragraph("Login Credentials", S_H2),
     bullet("Set a username and password in the Remote Access settings panel"),
     bullet("Remote visitors must sign in before accessing any page — local access always unrestricted"),
     bullet("Password stored as a bcrypt hash — never saved in plaintext"),
     Spacer(1, 8),
     Paragraph("CAPTCHA", S_H2),
     bullet("Math challenge shown on every login page load — blocks automated brute-force bots"),
     bullet("Challenge answer is consumed once (no replay) — wrong answer auto-reloads with a fresh challenge"),
    ],
    [Paragraph("DuckDNS", S_H2),
     bullet("Optional persistent domain (e.g. yourname.duckdns.org) — free at duckdns.org"),
     bullet("Enter your DuckDNS subdomain and token in the panel"),
     bullet("Forge automatically updates your DuckDNS IP every 5 minutes in the background"),
     bullet("Requires port 7432 forwarded on your router for direct access"),
     Spacer(1, 8),
     Paragraph("Status Dashboard", S_H2),
     bullet("Live status indicator: LIVE · ACCESSIBLE, RESTART REQUIRED, INCOMPLETE SETUP, DISABLED"),
     bullet("Checklist: cloudflared installed, PIN set, remote enabled, tunnel running"),
     bullet("Each failing check shows its specific fix instruction"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 14 — APP SYSTEM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("14 — APP SYSTEM", S_SECTION))
story.append(hr())

story.append(Paragraph("AI Backends", S_H2))
ai_data = [
    ["Ollama (local)", "No API key. Run entirely offline. Supports any model installed in Ollama — llama3.2, mistral, phi3, etc. Default and recommended for full privacy."],
    ["Groq",           "Cloud inference. Fast. Free tier available. Requires a Groq API key in Settings. Good for streaming responses at speed."],
    ["Claude (Anthropic)", "Cloud inference via Anthropic API. Highest quality generation — deepest character lore, most coherent arcs. Requires Anthropic API key."],
]
ai_tbl = Table(ai_data, colWidths=[1.6*inch, 4.9*inch])
ai_tbl.setStyle(TableStyle([
    ("BACKGROUND",(0,i),(-1,i), colors.HexColor("#D4AF3710" if i%2==0 else "#09090F")) for i in range(3)
] + [
    ("TEXTCOLOR",(0,0),(0,-1), GOLD),
    ("TEXTCOLOR",(1,0),(1,-1), TEXT2),
    ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),
    ("FONTNAME",(1,0),(1,-1),"Helvetica"),
    ("FONTSIZE",(0,0),(-1,-1),9),("LEADING",(0,0),(-1,-1),14),
    ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
    ("LEFTPADDING",(0,0),(-1,-1),8),
    ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#D4AF3740")),
    ("INNERGRID",(0,0),(-1,-1),0.3,colors.HexColor("#D4AF3720")),
]))
story.append(ai_tbl)
story.append(Spacer(1, 10))

story.append(Paragraph("Smart App Notifications", S_H2))
story.append(Paragraph(
    "Instead of raw browser alerts, all app-level messages appear as a persistent banner at the top of the screen "
    "with context-appropriate styling and action buttons.",
    S_BODY))
story.append(two_col(
    [bullet("Restart banner (amber): shown when a full Flask process restart is required — e.g. enabling remote access changes the bind address"),
     bullet("RESTART NOW button: calls /api/restart, waits 1.8s, then reloads — reopens on the same tab that was active"),
    ],
    [bullet("Reload banner (blue): shown when a page refresh is sufficient — e.g. after a Git update pull"),
     bullet("Error banner (red): shown for failed operations — update pull failures, save errors"),
     bullet("All banners are dismissable with the × button"),
    ]
))
story.append(Spacer(1, 10))

story.append(Paragraph("Performance & Caching", S_H2))
story.append(Paragraph(
    "The Forge uses aggressive caching for static assets and images, reducing load times significantly "
    "when accessed over the network via DNS or Cloudflare tunnel.",
    S_BODY))
story.append(two_col(
    [bullet("Vite-built JS and CSS assets have content-hash filenames — served with Cache-Control: max-age=31536000, immutable"),
     bullet("First remote visit downloads the 468KB bundle once; every subsequent visit loads from browser cache — near-instant"),
    ],
    [bullet("Character and team images served with Cache-Control: max-age=3600 and ETag headers (file mtime-based)"),
     bullet("304 Not Modified responses returned when an image hasn't changed — zero data transfer on repeat views"),
     bullet("index.html is always no-cache so the app always loads the latest version"),
    ]
))
story.append(Spacer(1, 10))

story.append(Paragraph("Theme & Persistence", S_H2))
story.append(two_col(
    [bullet("Light / Dark mode toggle — persisted to localStorage across restarts"),
     bullet("Active tab persisted to localStorage — app reopens on the same tab after restart or reload"),
    ],
    [bullet("Single-instance lock: .forge.lock file prevents duplicate Flask processes on the same machine"),
     bullet("Git update: Settings panel shows available updates — pull and restart in one action"),
    ]
))
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHANGELOG
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("CHANGELOG", S_SECTION))
story.append(hr())
story.append(Paragraph(
    "Major feature additions and fixes since the Forge was first built. "
    "Version numbers follow commit-count semver — every merged change increments the build.",
    S_BODY))
story.append(Spacer(1, 10))

changelog = [
    {
        "version": "Current Build",
        "date": "June 2026",
        "title": "Power Evolution + Logo Consistency + Performance",
        "color": GOLD,
        "items": [
            "Power set editor now supports + Add and × Remove buttons — heroes can gain, lose, or evolve powers at any time",
            "Ability Type selector: Powers / Arsenal / Skills — changes all section labels and input placeholders without altering data structure (supports Batman / Iron Man style characters with no innate powers)",
            "Team logo (uploaded) now appears in the Roster tab header alongside all other logo placements",
            "Static asset caching: JS/CSS bundles cached for 1 year (immutable) — near-instant repeat loads over DNS",
            "Image ETag support: 304 Not Modified on unchanged images — eliminates redundant data transfer",
            "Character sheet callout labels now source from power/ability names, not costume description",
            "Canvas reference sheet: hex color codes replaced with color swatch; power names replace costume word-wrap",
            "Login CAPTCHA on remote access sign-in — server-side math challenge blocks automated bots; challenge consumed on use, auto-reloads with fresh challenge on failure",
        ]
    },
    {
        "version": "v1.2.x",
        "date": "May–June 2026",
        "title": "Smart Notifications + Tab Persistence + Remote Panel",
        "color": TEAL_LT,
        "items": [
            "Global app alert banner system replacing raw alert() calls — distinguishes restart vs. reload scenarios",
            "RESTART NOW and RELOAD action buttons with appropriate behavior per alert type",
            "Tab persistence: active tab saved to localStorage — app reopens on the same tab after restart or reload",
            "RemotePanel refactored to use global alert system instead of its own inline banner",
        ]
    },
    {
        "version": "v1.2.x",
        "date": "April–May 2026",
        "title": "Power Set Fix & UI Responsiveness",
        "color": colors.HexColor("#AFA9EC"),
        "items": [
            "Power rendering fixed on character sheets for newly generated heroes",
            "Responsive layout improvements across roster grid and character cards",
            "Villain character sheets integrated — full sheet view for antagonists",
            "Team tab constellation view updated with alignment-coded edges",
        ]
    },
    {
        "version": "v1.2.x",
        "date": "March–April 2026",
        "title": "Hero Association + Origin Regeneration",
        "color": AMBER,
        "items": [
            "Hero Association feature: link characters as sidekick, partner, legacy ally, parallel version, or mentor",
            "Family tie creation: parent, sibling, child, cousin relationships stored per character",
            "Origin Regenerate from Race: AI rewrites origin through racial biology when requested from editor",
            "Story Direction field added to editor for AI origin regeneration targeting",
            "Age stage labels applied to AI image prompts (child, teen, young adult, middle-aged, elder)",
        ]
    },
    {
        "version": "v1.1.x",
        "date": "February–March 2026",
        "title": "Solo Heroes + Deep Forge + Race System",
        "color": colors.HexColor("#F0997B"),
        "items": [
            "Solo hero creation: independent heroes with no team, personal mission, and their own rogues gallery",
            "Solo story generation: AI generates a short arc featuring the solo hero and their rogues",
            "Deep Forge mode: 4-phase lore questionnaire producing deeply layered characters",
            "Personal Profile mode: 25-question psychological derivation for building heroes from real people",
            "Race selector with hierarchical Human / Mutate / Alien / Hybrid system",
            "Race lore injected into all AI generation prompts — powers and origins rooted in biology",
            "A-Gene Mutate codex entry with full discovery and activation lore",
            "Three alien species added: Zyrenian, Auranthi, Dravosi — each with full codex entries",
        ]
    },
    {
        "version": "v1.1.x",
        "date": "January–February 2026",
        "title": "Remote Access + Cloudflare + DuckDNS",
        "color": colors.HexColor("#5EB1FF"),
        "items": [
            "Cloudflare tunnel integration: auto-starts cloudflared at launch when remote access is enabled",
            "DuckDNS automatic IP updater: background loop refreshes DNS every 5 minutes",
            "Username / password authentication: login form with bcrypt-hashed password storage and session-based auth; local access always unrestricted",
            "Remote Access panel with live status dashboard and per-check fix instructions",
            "Flask rebind to 0.0.0.0 on remote enable — triggers restart notification via alert system",
        ]
    },
    {
        "version": "v1.0.x",
        "date": "Late 2025",
        "title": "Foundation — Teams, Roster, Recruit, Villains, Battle, Arc",
        "color": TEXT3,
        "items": [
            "Core team builder: create / edit / delete teams with color, type, alignment, logo, and motto",
            "Roster tab: image cards, character sheet expansion, PDF export, PNG reference sheet",
            "Recruit engine: quiz-driven hero generation with DNA anchor system",
            "Villain forge: targeted antagonist creation with hero roster awareness",
            "Battle engine: AI-simulated 1v1 with narrative output",
            "Arc generator: multi-issue story arcs with villain casting and issue-by-issue breakdown",
            "Nocturnal Knights pre-loaded with 4 core heroes: Wakháŋ, Null/Void, Catalix, Bastion Prime",
            "Ollama local AI integration — fully offline, no API keys required",
            "Dark/light theme with localStorage persistence",
            "Single-instance lock, Git update pull, Flask restart endpoint",
        ]
    },
]

for entry in changelog:
    c = entry["color"]
    hex_c = hx(c)
    story.append(KeepTogether([
        Paragraph(
            f'<font color="#{hex_c}"><b>{entry["version"]}</b></font>'
            f'  <font color="#{hx(TEXT3)}" size="8">{entry["date"]}</font>',
            ParagraphStyle("clv2",fontName="Courier-Bold",fontSize=10,textColor=c,leading=15,spaceBefore=8,spaceAfter=2)
        ),
        Paragraph(entry["title"],
            ParagraphStyle("clt2",fontName="Helvetica-Bold",fontSize=11,textColor=TEXT1,leading=16,spaceBefore=0,spaceAfter=4)
        ),
    ]))
    for item in entry["items"]:
        story.append(Paragraph(
            f'<font color="#{hex_c}" size="10">▸</font>  {item}',
            ParagraphStyle("cli",fontName="Helvetica",fontSize=9,textColor=TEXT2,leading=14,
                           leftIndent=14,firstLineIndent=-10,spaceBefore=0,spaceAfter=2)
        ))
    story.append(hr(colors.HexColor(f"#{hex_c}40"), 0.5, 6, 8))

story.append(Spacer(1, 0.4*inch))
story.append(Paragraph("SUPERHERO FORGE  ·  NOCTURNAL INC  ·  ALL RIGHTS RESERVED  ·  2026",
    ParagraphStyle("foot",fontName="Courier",fontSize=7.5,textColor=TEXT3,leading=11,alignment=TA_CENTER)))

# ── Build ─────────────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"✓  Forge_Features.pdf written to {OUT}")
