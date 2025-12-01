from pydantic import BaseModel

class StartupRequest(BaseModel):
    idea: str

class StartupPlan(BaseModel):
    idea: str
    problem_summary: str
    solution_summary: str
    target_audience: str
    market_and_competition: str
    revenue_model: str
    tech_architecture: str
    mvp_roadmap: str
    launch_strategy: str
