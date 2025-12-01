from typing import Dict

def run_startup_crew(idea: str) -> Dict[str, str]:
    """
    Very simple placeholder implementation.
    Returns a fake but structured startup plan for now.
    Once everything runs, we can swap this with real CrewAI logic.
    """
    base = "This is a placeholder. Replace with real AI logic later.\n\nIdea: " + idea

    return {
        "idea": f"Refined version of the idea: {idea}",
        "problem_summary": base + "\nProblem: Many people struggle with X related to this idea.",
        "solution_summary": "Solution: Build a focused product that solves X for a clear target audience.",
        "target_audience": "Target: 2–3 personas who feel the problem most (students, creators, teams, etc.).",
        "market_and_competition": "Market: Current tools are generic. This focuses on a specific workflow and niche.",
        "revenue_model": "Revenue: Likely SaaS (monthly), freemium with paid pro tier, or project-based pricing.",
        "tech_architecture": "Tech: Modern frontend (Next.js), backend API (FastAPI), database (Postgres), optional AI APIs.",
        "mvp_roadmap": "MVP: Week 1–2 – core flows; Week 3–4 – polish; Week 5–6 – onboarding, analytics, soft launch.",
        "launch_strategy": "Launch: Start with niche communities (Discord, Reddit, LinkedIn), ship a landing page, collect emails."
    }
