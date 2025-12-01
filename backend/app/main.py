import os
import json
from textwrap import dedent

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import StartupRequest, StartupPlan

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

def load_env_from_file(path: str) -> None:
    """Simple .env loader: KEY=VALUE per line."""
    if not os.path.exists(path):
        print(f"[ENV] .env file not found at: {path}")
        return
    print(f"[ENV] Loading env from: {path}")
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            # don't override if already in environment
            os.environ.setdefault(key, value)

load_env_from_file(ENV_PATH)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini")
MODEL_TEMPERATURE = float(os.getenv("MODEL_TEMPERATURE", "0.4"))

if not OPENAI_API_KEY:
    # Helpful debug info
    raise RuntimeError(f"OPENAI_API_KEY is not set. Checked .env at: {ENV_PATH}")

from crewai import Agent, Task, Crew, Process, LLM
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

llm = LLM(
    model=MODEL_NAME,
    api_key=OPENAI_API_KEY,
    temperature=MODEL_TEMPERATURE,
)

startup_orchestrator = Agent(
    role="Startup Builder Orchestrator",
    goal=(
        "Given a startup idea, act as a crew of specialists (market analyst, "
        "business model architect, technical architect, roadmap planner, GTM strategist) "
        "and produce a realistic startup blueprint in STRICT JSON."
    ),
    backstory=(
        "You have helped many founders refine messy ideas into clear, structured plans. "
        "You hate hallucinating. If details are unknown, you explicitly say 'Unknown' or "
        "'Best guess: ...' instead of making up fake numbers or companies."
    ),
    llm=llm,
    verbose=True,
)

def run_startup_crew(idea: str) -> dict:
    """
    Use a CrewAI Agent to generate a structured startup plan as JSON.
    """
    description = dedent(f"""
    You are a CREW of startup specialists working together:

    - Market Analyst
    - Business Model Architect
    - Technical Architect
    - MVP Roadmap Planner
    - Go-To-Market Strategist

    Your job: turn this raw idea into an ACTIONABLE startup plan.

    IDEA:
    "{idea}"

    RULES:
    - Be practical and realistic.
    - Focus on THIS specific idea, not generic startup advice.
    - If something is not obvious, write "Unknown" or "Best guess: ...".
    - DO NOT invent fake metrics, fake statistics, or fake company names.
    - Respond ONLY with a SINGLE JSON object. No markdown, no ``` fences, no explanation before or after.
    - Keep each field 3–8 sentences max.

    Use EXACTLY this JSON schema and keys:

    {{
      "idea": "string - restate the idea clearly in your own words",
      "problem_summary": "string - describe the core pain/need being solved",
      "solution_summary": "string - describe the actual product / service and how it works",
      "target_audience": "string - 2-3 main personas + their characteristics and pain points",
      "market_and_competition": "string - how people solve this today, types of competitors, and differentiation",
      "revenue_model": "string - business model, pricing logic, potential tiers",
      "tech_architecture": "string - high-level architecture: frontend, backend, DB, AI components, integrations",
      "mvp_roadmap": "string - realistic 4-8 week roadmap in phases or weeks",
      "launch_strategy": "string - first launch channels, first 100 users, and feedback loop"
    }}

    EXAMPLE OF FORMAT (STRUCTURE ONLY, CONTENT IS FAKE):

    {{
      "idea": "AI assistant for X ...",
      "problem_summary": "People today struggle with ...",
      "solution_summary": "This product will ...",
      "target_audience": "The main personas are ...",
      "market_and_competition": "Today, people use ...",
      "revenue_model": "SaaS monthly with ...",
      "tech_architecture": "Next.js frontend, FastAPI backend, Postgres, OpenAI API ...",
      "mvp_roadmap": "Week 1-2: ... Week 3-4: ...",
      "launch_strategy": "Launch on ..., reach out to ..., onboard first users via ..."
    }}

    AGAIN: Output MUST be a single valid JSON object matching that schema. No markdown, no commentary, no multiple JSON objects.
    """).strip()

    task = Task(
        description=description,
        agent=startup_orchestrator,
        expected_output="A single JSON object with all required keys."
    )

    crew = Crew(
        agents=[startup_orchestrator],
        tasks=[task],
        process=Process.sequential,
    )

    raw_result = crew.kickoff()
    raw_text = str(raw_result).strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        # If the model messes up formatting, surface the raw text for debugging
        raise ValueError(f"Model did not return valid JSON. Raw output was:\n{raw_text}") from e

    # Ensure all keys exist so FastAPI / frontend don't break
    required_keys = [
        "idea",
        "problem_summary",
        "solution_summary",
        "target_audience",
        "market_and_competition",
        "revenue_model",
        "tech_architecture",
        "mvp_roadmap",
        "launch_strategy",
    ]
    for key in required_keys:
        if key not in data or data[key] is None:
            data[key] = "Unknown"

    return data

# ---------------------------
# FastAPI app
# ---------------------------

app = FastAPI(
    title="AI Startup Builder API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # relax dev, tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/startup/plan", response_model=StartupPlan)
def generate_startup_plan(payload: StartupRequest):
    try:
        data = run_startup_crew(payload.idea)
    except ValueError as e:
        # JSON parse issues from the model
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    return StartupPlan(**data)

@app.post("/api/startup/critique")
def critique_plan(payload: dict):
    """Generate deep critique using OpenAI."""
    idea = payload.get("idea", "")
    plan = payload.get("plan", {})

    if not idea or not plan:
        raise HTTPException(status_code=400, detail="idea and plan required")

    prompt = f"""
You are a VC-level startup analyst.

CRITIQUE THIS IDEA + PLAN DEEPLY:

Idea:
{idea}

Plan:
{json.dumps(plan, indent=2)}

FORMAT THE OUTPUT AS:
- 🔥 Overall thesis
- ✅ What is strong
- ⚠️ What is weak
- 🧪 What MUST be validated first
- 🚀 Execution steps
    """

    try:
        response = client.responses.create(
            model=MODEL_NAME,
            input=prompt,
            temperature=MODEL_TEMPERATURE,
        )
        critique_text = response.output_text
        return { "critique": critique_text }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Critique generation failed: {str(e)}")


@app.post("/api/startup/pitch")
def generate_pitch(payload: dict):
    idea = payload.get("idea", "")
    plan = payload.get("plan", {})

    if not idea or not plan:
        raise HTTPException(status_code=400, detail="idea and plan required")

    prompt = f"""
Turn this idea + plan into a 10-slide pitch deck.

Idea:
{idea}

Plan:
{json.dumps(plan, indent=2)}

Format strictly as JSON LIST:
[
  {{"title": "...", "content": "..."}},
  ...
]
    """

    try:
        response = client.responses.create(
            model=MODEL_NAME,
            input=prompt,
            temperature=0.2,
        )
        raw = response.output_text

        deck = json.loads(raw)
        return { "slides": deck }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch deck generation failed: {str(e)}")


from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import tempfile

@app.post("/api/startup/pdf")
def generate_pdf(payload: dict):
    """Generate a real PDF pitch deck."""
    slides = payload.get("slides", [])

    if not slides:
        raise HTTPException(status_code=400, detail="slides missing")

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    pdf_path = temp.name
    temp.close()

    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter

    for slide in slides:
        title = slide["title"]
        content = slide["content"]

        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 80, title)

        c.setFont("Helvetica", 12)

        y = height - 120
        for line in content.split("\n"):
            c.drawString(50, y, line)
            y -= 20
            if y < 80:
                c.showPage()
                c.setFont("Helvetica-Bold", 20)
                c.drawString(50, height - 80, title)
                c.setFont("Helvetica", 12)
                y = height - 120

        c.showPage()

    c.save()

    return FileResponse(pdf_path, filename="pitchdeck.pdf")
