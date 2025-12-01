"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import InsightsIcon from "@mui/icons-material/Insights";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CompareIcon from "@mui/icons-material/Compare";

type StartupPlan = {
  idea: string;
  problem_summary: string;
  solution_summary: string;
  target_audience: string;
  market_and_competition: string;
  revenue_model: string;
  tech_architecture: string;
  mvp_roadmap: string;
  launch_strategy: string;
};

type SavedPlan = {
  id: string;
  label: string;
  idea: string;
  plan: StartupPlan;
  createdAt: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL;

const shortLabel = (idea: string, idx: number) => {
  const clean = idea.trim().replace(/\s+/g, " ");
  if (!clean) return `Idea ${idx + 1}`;
  if (clean.length <= 40) return clean;
  return clean.slice(0, 37) + "...";
};

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StartupPlan | null>(null);

  const [focusedSection, setFocusedSection] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const [activeTab, setActiveTab] =
    useState<"plan" | "critique" | "pitch" | "compare">("plan");

  const [sectionLoading, setSectionLoading] = useState<
    Record<string, boolean>
  >({});
  const [critiqueText, setCritiqueText] = useState<string | null>(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setPlan(null);
    setCritiqueText(null);
    setFocusedSection(null);

    try {
      const res = await axios.post<StartupPlan>(
        `${API_BASE}/api/startup/plan`,
        { idea }
      );
      setPlan(res.data);
      setActiveTab("plan");
    } catch (err) {
      console.error(err);
      alert("Error generating startup plan. Check console/logs.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateSection = async (sectionKey: keyof StartupPlan) => {
    if (!idea.trim()) return;
    setSectionLoading((prev) => ({ ...prev, [sectionKey]: true }));

    try {
      const res = await axios.post<StartupPlan>(
        `${API_BASE}/api/startup/plan`,
        { idea }
      );
      const fresh = res.data;
      setPlan((prev) =>
        prev ? { ...prev, [sectionKey]: fresh[sectionKey] } : fresh
      );
      if (focusedSection && focusedSection.title === sectionKey) {
        setFocusedSection({
          title: sectionKey.replace(/_/g, " "),
          content: fresh[sectionKey] as string,
        });
      }
    } catch (err) {
      console.error(err);
      alert(`Error regenerating section "${sectionKey}".`);
    } finally {
      setSectionLoading((prev) => ({ ...prev, [sectionKey]: false }));
    }
  };

  const saveCurrentPlan = () => {
    if (!plan || !idea.trim()) return;
    const id = `${Date.now()}`;
    const label = shortLabel(idea, savedPlans.length);
    const createdAt = new Date().toLocaleString();
    const newSaved: SavedPlan = { id, label, idea, plan, createdAt };
    setSavedPlans((prev) => [...prev, newSaved]);
    if (!compareLeftId) setCompareLeftId(id);
    else if (!compareRightId) setCompareRightId(id);
    alert("Plan saved for comparison!");
  };

  const buildCritiqueFromPlan = (p: StartupPlan): string => {
    return [
      "⚙️ Overall Impression:",
      `This idea focuses on: ${p.idea}`,
      "",
      "✅ Strengths:",
      `• Problem clarity: ${p.problem_summary.slice(0, 200)}...`,
      `• Solution direction: ${p.solution_summary.slice(0, 200)}...`,
      "",
      "⚠️ Potential Risks:",
      "• Market & competition may be tougher than assumed – verify competitors & substitutes in reality.",
      "• Tech architecture and MVP scope must be kept tight to avoid over-building in v1.",
      "",
      "🧪 What to Validate First:",
      `• Talk to real target users: ${p.target_audience.slice(0, 200)}...`,
      "• Validate whether people would actually pay in the proposed revenue model.",
      "",
      "🚀 Next Concrete Steps:",
      "• Implement just the critical path from the MVP roadmap.",
      "• Ship something small, collect feedback, iterate on riskiest assumptions first.",
    ].join("\n");
  };

  const generateCritique = () => {
    if (!plan) return;
    setCritiqueLoading(true);
    const c = buildCritiqueFromPlan(plan);
    setCritiqueText(c);
    setActiveTab("critique");
    setTimeout(() => setCritiqueLoading(false), 400);
  };

  const sections =
    plan &&
    ([
      { key: "idea", title: "Refined Idea", content: plan.idea },
      {
        key: "problem_summary",
        title: "Problem Summary",
        content: plan.problem_summary,
      },
      {
        key: "solution_summary",
        title: "Solution Overview",
        content: plan.solution_summary,
      },
      {
        key: "target_audience",
        title: "Target Audience",
        content: plan.target_audience,
      },
      {
        key: "market_and_competition",
        title: "Market & Competition",
        content: plan.market_and_competition,
      },
      {
        key: "revenue_model",
        title: "Revenue Model",
        content: plan.revenue_model,
      },
      {
        key: "tech_architecture",
        title: "Tech Architecture",
        content: plan.tech_architecture,
      },
      {
        key: "mvp_roadmap",
        title: "MVP Roadmap",
        content: plan.mvp_roadmap,
      },
      {
        key: "launch_strategy",
        title: "Launch Strategy",
        content: plan.launch_strategy,
      },
    ] as const);

  const pitchSlides =
    plan &&
    [
      {
        title: "Title & Tagline",
        body: `${plan.idea}\n\nTagline: An AI-powered way to solve a specific pain for a focused audience.`,
      },
      { title: "Problem", body: plan.problem_summary },
      { title: "Solution", body: plan.solution_summary },
      { title: "Target Audience", body: plan.target_audience },
      { title: "Market & Competition", body: plan.market_and_competition },
      { title: "Business Model", body: plan.revenue_model },
      { title: "Product & Tech", body: plan.tech_architecture },
      { title: "MVP & Roadmap", body: plan.mvp_roadmap },
      { title: "Go-To-Market", body: plan.launch_strategy },
    ];

  const leftPlan = savedPlans.find((p) => p.id === compareLeftId) || null;
  const rightPlan = savedPlans.find((p) => p.id === compareRightId) || null;

  return (
  <Box
    sx={{
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      overflowX: "hidden",
      overflowY: "auto",
      m: 0,
      p: 0,
      // FULL PAGE BACKGROUND IMAGE
      backgroundImage:
        'url("https://stvp.stanford.edu/wp-content/uploads/sites/3/2019/01/beyond-basics-lean-startup.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
    }}
  >

   <Container
  maxWidth="lg"   
  disableGutters
  sx={{
    position: "relative",
    zIndex: 1,
    my: { xs: 2, md: 4 },
    px: { xs: 4, md: 8 },     
    py: { xs: 4, md: 6 },     

    width: "100%",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(25px)",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.45)",
    boxShadow: "0 40px 80px rgba(0,0,0,0.22)",

    // ⭐ MORE READABLE MASSIVE TYPOGRAPHY
    fontFamily: `"Inter", "Poppins", sans-serif`,
    "& h1, & h2, & h3, & h4, & h5, & h6": {
      color: "#0f172a",
      fontWeight: 800,
      letterSpacing: "-1px",
    },
    "& p, & span, & .MuiTypography-body1, & .MuiTypography-body2": {
      fontSize: "1.15rem",
      lineHeight: 1.75,
      color: "#1e293b",
      fontWeight: 500,
    },
  }}
>


        {/* Top bar / app nav */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.18em",
                fontSize: "1.2rem",
                textTransform: "uppercase",
                color: "#1a4581ff",
              }}
            >
              Crew Startup Lab
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 1000,
                letterSpacing: "0.02em",
              }}
            >
              Your AI startup buddy
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Turn messy ideas into clear startup blueprints, without staring at a
              blank page.
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            textColor="inherit"
            sx={{
              borderRadius: 999,
              p: 0.5,
              backgroundColor: "rgba(248,250,252,0.95)",
              "& .MuiTabs-flexContainer": { gap: 0.5 },
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "0.95rem",
                minHeight: 0,
                borderRadius: 999,
                px: 1.8,
                py: 0.6,
                alignItems: "center",
              },
              "& .Mui-selected": {
                backgroundColor: "#111827",
                color: "#f9fafb !important",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab value="plan" label="Plan" />
            <Tab
              value="compare"
              label="Compare"
              icon={<CompareIcon sx={{ fontSize: 24 }} />}
              iconPosition="start"
            />
            <Tab
              value="pitch"
              label="Pitch Deck"
              icon={<PictureAsPdfIcon sx={{ fontSize: 24 }} />}
              iconPosition="start"
            />
            <Tab
              value="critique"
              label="Critique"
              icon={<InsightsIcon sx={{ fontSize: 24 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Divider sx={{ borderColor: "rgba(143, 176, 221, 0.3)" }} />
        {/* HERO SECTION – Wix-style: big headline + CTA + floating card */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: { xs: 3.5, md: 5 },
          }}
        >
          {/* Left: hero text */}
          <Box sx={{ maxWidth: 620 }}>
            <Typography
              variant="h2"
              sx={{
  fontWeight: 900,
  fontSize: { xs: "2.5rem", md: "3.4rem" },
  lineHeight: 1.1,
  letterSpacing: "-1px",
  color: "#0f172a",
  textShadow: "0 2px 20px rgba(0,0,0,0.08)",
  mb: 2,
}}
            >
              Create a startup
              <Box component="span" sx={{ display: "block" }}>
                plan without limits
              </Box>
            </Typography>

            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
              Bring your idea to life with an AI builder that turns a simple description
              into a full startup blueprint – problem, solution, revenue, tech and launch.
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading || !idea.trim()}
                sx={{
                  px: 3.5,
                  py: 1.4,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  background: "linear-gradient(135deg, #6366F1, #EC4899)",
                  boxShadow: "0 18px 45px rgba(99,102,241,0.45)",
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Get started with your idea"
                )}
              </Button>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                No decks. No spreadsheets. Just describe what&apos;s in your head.
              </Typography>
            </Box>

            <Chip
              label="FastAPI • Next.js • Crew-AI orchestration"
              variant="outlined"
              sx={{
                borderColor: "rgba(148,163,184,0.7)",
                color: "#4b5563",
                mt: 2.5,
                backgroundColor: "rgba(248,250,252,0.9)",
                fontSize: "0.95rem",
                px: 1,
              }}
            />
          </Box>

          {/* Right: Idea Console “floating card” */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            sx={{
              position: "relative",
              borderRadius: 4,
              p: 3,
              width: { xs: "100%", md: 380 },
              background:
                "linear-gradient(135deg, rgba(129,140,248,0.97), rgba(251,191,36,0.95))",
              boxShadow: "0 26px 70px rgba(148,163,184,0.6)",
              border: "1px solid rgba(148,163,184,0.85)",
              color: "#0f172a",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                backdropFilter: "blur(16px)",
                opacity: 0.9,
              },
              "& > *": {
                position: "relative",
                zIndex: 1,
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                mb: 0.5,
                fontSize: "1rem",
fontWeight: 600,
color: "#0f172a",
              }}
            >
              Idea console
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.95 }}>
              Describe your startup like you&apos;d text a friend. The crew expands it into
              a multi-section blueprint.
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={3}
              variant="outlined"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: AI app for hostel maintenance in Indian colleges with student app + warden dashboard + auto-prioritized tickets."
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.97)",
                  color: "#0f172a",
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
              <Button
                fullWidth
                disabled={loading}
                onClick={handleGenerate}
                variant="contained"
                sx={{
                  py: 1.2,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 1000,
                  fontSize: "0.95rem",
                  background: "linear-gradient(135deg, #6366F1, #EC4899)",
                  boxShadow: "0 12px 40px rgba(99,102,241,0.45)",
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Generate startup plan"
                )}
              </Button>
              <Tooltip title="Save current plan for comparison">
                <span>
                  <IconButton
                    onClick={saveCurrentPlan}
                    disabled={!plan}
                    sx={{
                      borderRadius: 999,
                      border: "1px solid rgba(15,23,42,0.9)",
                      backgroundColor: "rgba(15,23,42,0.96)",
                      color: "#e5e7eb",
                    }}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* PLAN TAB */}
        {activeTab === "plan" && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 6 }}
          >
            {!sections && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Generate a plan to see the specialist cards. Click a card to focus it,
                or refresh individual sections.
              </Typography>
            )}

            {sections && (
              <>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                    Your startup blueprint
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Each card is one specialist&apos;s output. Click a card to focus it,
                    or regenerate that part alone.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 3,
                  }}
                >
                  {sections.map((section, idx) => (
                    <Paper
                      key={section.key}
                      component={motion.div}
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.05 * idx }}
                      whileHover={{
                        y: -4,
                        boxShadow: "0 18px 45px rgba(148,163,184,0.5)",
                        scale: 1.01,
                      }}
                      onClick={() =>
                        setFocusedSection({
                          title: section.title,
                          content: section.content,
                        })
                      }
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        border: "1px solid rgba(203,213,225,0.9)",
                        background:
                          "linear-gradient(135deg, #f9fafb, #e5e7eb)",
                        boxShadow: "0 14px 40px rgba(148,163,184,0.35)",
                        minHeight: 190,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        cursor: "pointer",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 900,
                            letterSpacing: "0.04em",
                            color: "#111827",
                          }}
                        >
                          {section.title}
                        </Typography>
                        <Tooltip title="Regenerate only this section">
                          <span>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                regenerateSection(
                                  section.key as keyof StartupPlan
                                );
                              }}
                              disabled={sectionLoading[section.key]}
                              sx={{
                                borderRadius: 999,
                                border: "1px solid rgba(148,163,184,0.7)",
                                backgroundColor: "#0f172a",
                                color: "#e5e7eb",
                              }}
                            >
                              {sectionLoading[section.key] ? (
                                <CircularProgress size={14} />
                              ) : (
                                <RefreshIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>

                      <Typography
                        variant="body2"
                       sx={{
  whiteSpace: "pre-wrap",
  fontSize: "1.15rem",
  lineHeight: 1.75,
  color: "#284fa9ff",
  opacity: 0.95,
  fontWeight: 500,
}}

                      >
                        {section.content}
                      </Typography>
                    </Paper>
                  ))}
                </Box>

                {focusedSection && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    sx={{
                      mt: 4,
                      p: 3,
                      borderRadius: 4,
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "linear-gradient(135deg, #020617, #111827)",
                      boxShadow: "0 24px 70px rgba(15,23,42,0.7)",
                      color: "rgba(249,250,251,0.98)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ opacity: 0.7, mb: 0.5 }}
                    >
                      Focused section
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 900, mb: 1 }}
                    >
                      {focusedSection.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
  whiteSpace: "pre-wrap",
  fontSize: "1.25rem",
  lineHeight: 1.75,
  color: "#257ef1ff",
  opacity: 0.95,
  fontWeight: 500,
}}

                    >
                      {focusedSection.content}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    mt: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="outlined"
                    disabled={!plan || critiqueLoading}
                    onClick={generateCritique}
                    startIcon={<InsightsIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      borderColor: "rgba(148,163,184,0.7)",
                    }}
                  >
                    {critiqueLoading
                      ? "Generating critique..."
                      : "Generate critique view"}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={!plan}
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => setActiveTab("pitch")}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      borderColor: "rgba(148,163,184,0.7)",
                    }}
                  >
                    View pitch deck layout
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}

        {/* CRITIQUE TAB */}
        {activeTab === "critique" && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            sx={{ mt: 3, mb: 5 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 1000 }}>
                AI-style critique
              </Typography>
              <InsightsIcon fontSize="small" />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
              This is a critique generated from your current plan. Regenerate plan or
              individual sections and refresh this view as needed.
            </Typography>

            {!plan && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Generate a plan first in the Plan tab, then click
                &quot;Generate critique view&quot;.
              </Typography>
            )}

            {plan && !critiqueText && !critiqueLoading && (
              <Button
                variant="outlined"
                startIcon={<InsightsIcon />}
                onClick={generateCritique}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  borderColor: "rgba(134, 162, 202, 0.7)",
                }}
              >
                Generate critique view
              </Button>
            )}

            {critiqueLoading && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Thinking through the plan and building a critique...
              </Typography>
            )}

            {critiqueText && (
              <Paper
                component={motion.div}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                sx={{
                  mt: 2,
                  p: 3,
                  borderRadius: 4.5,
                  border: "1px solid rgba(203,213,225,0.9)",
                  background:
                    "linear-gradient(135deg, #f9fafb, #e5e7eb)",
                  boxShadow: "0 14px 40px rgba(148,163,184,0.35)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    opacity: 0.95,
                    fontSize: "1.3rem",
                    lineHeight: 1.6,
                    color: "#111827",
                  }}
                >
                  {critiqueText}
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* PITCH TAB */}
        {activeTab === "pitch" && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            sx={{ mt: 3, mb: 5 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Pitch deck layout
              </Typography>
              <PictureAsPdfIcon fontSize="small" />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
              Slide-style layout built from your plan. Use your browser&apos;s{" "}
              <strong>Print → Save as PDF</strong> to export as a quick deck.
            </Typography>

            {!pitchSlides && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Generate a plan first to see slides here.
              </Typography>
            )}

            {pitchSlides && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 3,
                }}
              >
                {pitchSlides.map((slide, idx) => (
                  <Paper
                    key={slide.title}
                    component={motion.div}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.06 * idx }}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: "1px solid rgba(209,213,219,0.9)",
                      background:
                        "linear-gradient(135deg, #ffffff, #f3f4f6)",
                      boxShadow: "0 18px 45px rgba(148,163,184,0.3)",
                      minHeight: 200,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      color: "#111827",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ opacity: 0.8 }}
                    >
                      Slide {idx + 1}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      {slide.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        opacity: 0.95,
                        fontSize: "0.85rem",
                      }}
                    >
                      {slide.body}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            sx={{ mt: 3, mb: 5 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Compare saved ideas side-by-side
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
              Save different plans from the Plan tab, then select them here to compare.
            </Typography>

            {savedPlans.length === 0 && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                No saved plans yet. Generate a plan and click the save icon on the input
                card to pin it.
              </Typography>
            )}

            {savedPlans.length > 0 && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel id="compare-left-label">Left idea</InputLabel>
                    <Select
                      labelId="compare-left-label"
                      value={compareLeftId}
                      label="Left idea"
                      onChange={(e) => setCompareLeftId(e.target.value)}
                    >
                      {savedPlans.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel id="compare-right-label">Right idea</InputLabel>
                    <Select
                      labelId="compare-right-label"
                      value={compareRightId}
                      label="Right idea"
                      onChange={(e) => setCompareRightId(e.target.value)}
                    >
                      {savedPlans.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 3,
                  }}
                >
                  {[leftPlan, rightPlan].map((planSide, idx) => (
                    <Paper
                      key={idx === 0 ? "left" : "right"}
                      sx={{
                        p: 2.5,
                        borderRadius: 4,
                        border: "1px solid rgba(209,213,219,0.9)",
                        background:
                          "linear-gradient(135deg, #ffffff, #f3f4f6)",
                        boxShadow: "0 14px 40px rgba(148,163,184,0.3)",
                        color: "#111827",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ opacity: 0.7, mb: 0.5 }}
                      >
                        {idx === 0 ? "Left idea" : "Right idea"}
                      </Typography>
                      {planSide ? (
                        <>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, mb: 1 }}
                          >
                            {planSide.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.7 }}
                          >
                            Saved: {planSide.createdAt}
                          </Typography>
                          <Divider
                            sx={{
                              my: 1.5,
                              borderColor: "rgba(148,163,184,0.4)",
                            }}
                          />
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Refined idea:</strong>{" "}
                            {planSide.plan.idea}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Problem:</strong>{" "}
                            {planSide.plan.problem_summary}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Solution:</strong>{" "}
                            {planSide.plan.solution_summary}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Audience:</strong>{" "}
                            {planSide.plan.target_audience}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Market & competition:</strong>{" "}
                            {planSide.plan.market_and_competition}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Revenue model:</strong>{" "}
                            {planSide.plan.revenue_model}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Tech:</strong>{" "}
                            {planSide.plan.tech_architecture}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>MVP roadmap:</strong>{" "}
                            {planSide.plan.mvp_roadmap}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Launch strategy:</strong>{" "}
                            {planSide.plan.launch_strategy}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Select a saved idea for this side.
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );

}



