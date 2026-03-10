import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task_type, payload } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let toolChoice: any | undefined;

    if (task_type === "lead_score") {
      systemPrompt = `You are an expert B2B lead scoring engine for a digital agency CRM. Score leads based on their attributes. Consider: source quality, budget size, service type demand, response urgency, and industry fit.`;
      userPrompt = `Score this lead and provide recommendations:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "score_lead",
          description: "Return a lead score with priority and recommended action",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number", description: "Score 0-100" },
              priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
              recommended_action: { type: "string", description: "Next best action for this lead" },
              reasoning: { type: "string", description: "Brief explanation of the score" },
              conversion_probability: { type: "number", description: "Conversion probability 0-100" },
            },
            required: ["score", "priority", "recommended_action", "reasoning", "conversion_probability"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "score_lead" } };

    } else if (task_type === "seo_analysis") {
      systemPrompt = `You are an expert SEO analyst for a digital agency. Analyze the provided campaign data and give actionable recommendations.`;
      userPrompt = `Analyze this SEO campaign and provide recommendations:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "seo_recommendations",
          description: "Return SEO analysis with actionable recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string", enum: ["on_page", "off_page", "technical", "content", "local"] },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                    title: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["category", "priority", "title", "description"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["recommendations", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "seo_recommendations" } };

    } else if (task_type === "sales_forecast") {
      systemPrompt = `You are a sales analytics AI for a digital agency. Based on the pipeline data, forecast monthly revenue.`;
      userPrompt = `Forecast revenue based on this pipeline data:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "forecast_revenue",
          description: "Return revenue forecast with confidence",
          parameters: {
            type: "object",
            properties: {
              projected_revenue: { type: "number" },
              confidence: { type: "number", description: "0-100 confidence percentage" },
              factors: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
              projected_annual: { type: "number", description: "Projected annual revenue" },
            },
            required: ["projected_revenue", "confidence", "factors", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "forecast_revenue" } };

    } else if (task_type === "churn_detection") {
      systemPrompt = `You are a customer success AI for a digital agency CRM. Analyze customer data and predict churn risk. Consider: payment history, support ticket frequency, communication recency, usage patterns, contract status.`;
      userPrompt = `Analyze this customer for churn risk:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "detect_churn",
          description: "Return churn risk assessment for a customer",
          parameters: {
            type: "object",
            properties: {
              churn_probability: { type: "number", description: "Churn probability 0-100" },
              health_score: { type: "number", description: "Customer health score 0-100" },
              risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              risk_factors: { type: "array", items: { type: "string" } },
              recommended_actions: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
            },
            required: ["churn_probability", "health_score", "risk_level", "risk_factors", "recommended_actions", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "detect_churn" } };

    } else if (task_type === "marketing_analysis") {
      systemPrompt = `You are a marketing analytics AI for a digital agency. Analyze channel performance data and provide budget optimization recommendations. Consider: leads generated, conversion rates, cost per lead, ROI, and industry benchmarks.`;
      userPrompt = `Analyze marketing channel performance and recommend budget changes:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "analyze_marketing",
          description: "Return marketing channel analysis with budget recommendations",
          parameters: {
            type: "object",
            properties: {
              channel_analysis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    channel: { type: "string" },
                    performance_rating: { type: "string", enum: ["POOR", "FAIR", "GOOD", "EXCELLENT"] },
                    roi_score: { type: "number" },
                    budget_recommendation: { type: "string", enum: ["INCREASE", "MAINTAIN", "DECREASE", "PAUSE"] },
                    recommended_change_percent: { type: "number" },
                  },
                  required: ["channel", "performance_rating", "roi_score", "budget_recommendation"],
                  additionalProperties: false,
                },
              },
              top_channel: { type: "string" },
              summary: { type: "string" },
            },
            required: ["channel_analysis", "top_channel", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "analyze_marketing" } };

    } else if (task_type === "business_recommendations") {
      systemPrompt = `You are a business intelligence AI advisor for a digital agency CRM. Based on the overall business data (leads, deals, customers, revenue, marketing), generate 3-7 high-impact actionable recommendations. Each recommendation should be specific, measurable, and tied to a business outcome.`;
      userPrompt = `Generate business recommendations based on this data:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "generate_recommendations",
          description: "Return prioritized business recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    recommendation_type: { type: "string", enum: ["lead_followup", "deal_risk", "churn_prevention", "marketing_optimization", "revenue_growth", "operational"] },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    impact_score: { type: "number", description: "Expected impact 0-100" },
                    entity_type: { type: "string", description: "lead, deal, client, campaign, or general" },
                  },
                  required: ["recommendation_type", "priority", "title", "description", "impact_score"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_recommendations" } };

    } else if (task_type === "pricing_recommendation") {
      systemPrompt = `You are a pricing strategy AI for a digital agency. Analyze past deal data, close rates by price range, and industry benchmarks to recommend optimal pricing ranges for services.`;
      userPrompt = `Recommend pricing based on this deal history:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "recommend_pricing",
          description: "Return pricing recommendations by service type",
          parameters: {
            type: "object",
            properties: {
              pricing_recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    service_type: { type: "string" },
                    recommended_min: { type: "number" },
                    recommended_max: { type: "number" },
                    optimal_price: { type: "number" },
                    close_rate_at_optimal: { type: "number" },
                    reasoning: { type: "string" },
                  },
                  required: ["service_type", "recommended_min", "recommended_max", "optimal_price", "reasoning"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["pricing_recommendations", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "recommend_pricing" } };

    } else if (task_type === "budget_optimizer") {
      systemPrompt = `You are a marketing budget optimization AI for a digital agency. Analyze campaign performance data and recommend budget adjustments to maximize ROI. Consider: conversion rates, cost per lead, channel saturation, seasonal trends.`;
      userPrompt = `Optimize budgets for these campaigns:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "optimize_budgets",
          description: "Return budget adjustment recommendations per channel",
          parameters: {
            type: "object",
            properties: {
              adjustments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    channel: { type: "string" },
                    current_budget: { type: "number" },
                    recommended_budget: { type: "number" },
                    change_percent: { type: "number" },
                    reasoning: { type: "string" },
                    expected_roi_improvement: { type: "number" },
                  },
                  required: ["channel", "recommended_budget", "change_percent", "reasoning"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["adjustments", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "optimize_budgets" } };

    } else if (task_type === "generate_landing_page") {
      systemPrompt = `You are a conversion-focused landing page copywriter for a digital agency. Generate compelling landing page content optimized for the given keyword, industry, and location. Include headline, subheadline, key benefits, service sections, FAQ items, testimonials placeholders, and a strong CTA.`;
      userPrompt = `Generate landing page content for:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "create_landing_page",
          description: "Return structured landing page content",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string" },
              subheadline: { type: "string" },
              meta_description: { type: "string" },
              hero_cta: { type: "string" },
              benefits: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"], additionalProperties: false } },
              service_sections: { type: "array", items: { type: "object", properties: { heading: { type: "string" }, body: { type: "string" } }, required: ["heading", "body"], additionalProperties: false } },
              faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"], additionalProperties: false } },
              cta_text: { type: "string" },
            },
            required: ["headline", "subheadline", "meta_description", "benefits", "service_sections", "faqs", "cta_text"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_landing_page" } };

    } else if (task_type === "seo_autopilot") {
      systemPrompt = `You are an SEO strategist AI for a digital agency. Given a primary keyword, location, and industry, generate a list of SEO tasks including suburb pages, blog article titles, FAQ content, and internal linking suggestions.`;
      userPrompt = `Generate SEO tasks for:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "generate_seo_tasks",
          description: "Return a list of SEO content tasks",
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    task_type: { type: "string", enum: ["suburb_page", "blog_article", "faq_content", "service_page", "internal_linking"] },
                    keyword: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["task_type", "keyword", "title", "description"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["tasks", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_seo_tasks" } };

    } else if (task_type === "auto_proposal") {
      systemPrompt = `You are a proposal writing AI for a digital agency. Based on the lead data, service type, and pricing guidelines, generate a professional proposal with scope, deliverables, timeline, and pricing.`;
      userPrompt = `Generate a proposal for this lead:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "generate_proposal",
          description: "Return a structured proposal",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              service_type: { type: "string" },
              scope_summary: { type: "string" },
              deliverables: { type: "array", items: { type: "string" } },
              timeline_weeks: { type: "number" },
              proposed_price: { type: "number" },
              payment_terms: { type: "string" },
              value_proposition: { type: "string" },
            },
            required: ["title", "service_type", "scope_summary", "deliverables", "timeline_weeks", "proposed_price"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_proposal" } };

    } else if (task_type === "ab_experiment") {
      systemPrompt = `You are a conversion rate optimization AI. Analyze A/B test results and determine a statistical winner. Consider sample size, conversion rates, and statistical significance.`;
      userPrompt = `Analyze this A/B experiment:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "analyze_experiment",
          description: "Return experiment analysis with winner",
          parameters: {
            type: "object",
            properties: {
              winner: { type: "string", enum: ["A", "B", "inconclusive"] },
              confidence_level: { type: "number" },
              uplift_percent: { type: "number" },
              recommendation: { type: "string" },
              summary: { type: "string" },
            },
            required: ["winner", "confidence_level", "recommendation", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "analyze_experiment" } };

    } else if (task_type === "business_health") {
      systemPrompt = `You are a business health analysis AI for a digital agency CRM. Evaluate the overall health of the business based on revenue trends, lead generation, customer churn, marketing ROI, and team productivity. Return a health score, growth score, and risk score (each 0-100), plus a summary.`;
      userPrompt = `Analyze business health:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "assess_health",
          description: "Return business health scores",
          parameters: {
            type: "object",
            properties: {
              health_score: { type: "number", description: "Overall business health 0-100" },
              growth_score: { type: "number", description: "Growth trajectory 0-100" },
              risk_score: { type: "number", description: "Overall risk level 0-100 (higher=riskier)" },
              summary: { type: "string" },
              key_strengths: { type: "array", items: { type: "string" } },
              key_risks: { type: "array", items: { type: "string" } },
            },
            required: ["health_score", "growth_score", "risk_score", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "assess_health" } };

    } else if (task_type === "team_analysis") {
      systemPrompt = `You are a team performance analysis AI for a digital agency. Analyze employee productivity, lead handling, deal conversion rates, and response times. Generate performance scores for each team member and recommendations.`;
      userPrompt = `Analyze team performance:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "analyze_team",
          description: "Return team performance analysis",
          parameters: {
            type: "object",
            properties: {
              team_members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    performance_score: { type: "number" },
                    conversion_rate: { type: "number" },
                    task_completion_rate: { type: "number" },
                    response_time_minutes: { type: "number" },
                    recommendation: { type: "string" },
                  },
                  required: ["name", "performance_score"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["team_members", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "analyze_team" } };

    } else if (task_type === "ai_advisor") {
      systemPrompt = `You are a senior business advisor AI for a digital agency CRM platform. Answer the user's business question using your knowledge of CRM best practices, sales optimization, marketing strategy, and team management. Be specific, actionable, and data-driven in your response.`;
      userPrompt = `Business question: ${payload?.question || "How can I grow my business?"}\n\nContext: ${JSON.stringify(payload)}`;

    } else if (task_type === "behavior_analysis") {
      systemPrompt = `You are a behavioral analytics AI for a digital agency CRM. Analyze user behavior, lead interactions, campaign performance, and messaging effectiveness to identify actionable patterns. Return 3-7 patterns with confidence scores and recommendations.`;
      userPrompt = `Identify behavior patterns from this business data:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "identify_patterns",
          description: "Return identified behavior patterns",
          parameters: {
            type: "object",
            properties: {
              patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    pattern_type: { type: "string", enum: ["channel_preference", "timing", "conversion", "engagement", "churn_signal", "growth_signal"] },
                    description: { type: "string" },
                    confidence_score: { type: "number", description: "0-100" },
                    recommendation: { type: "string" },
                  },
                  required: ["pattern_type", "description", "confidence_score"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["patterns", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "identify_patterns" } };

    } else if (task_type === "workflow_optimization") {
      systemPrompt = `You are a workflow optimization AI for a digital agency CRM. Analyze existing workflows (lead follow-up, sales pipeline, marketing sequences) and suggest concrete adaptations to improve efficiency, conversion rates, and response times. Return 2-5 actionable adaptations.`;
      userPrompt = `Optimize workflows for this business:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "suggest_adaptations",
          description: "Return workflow adaptation suggestions",
          parameters: {
            type: "object",
            properties: {
              adaptations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    workflow_type: { type: "string", enum: ["lead_followup", "sales_pipeline", "marketing_sequence", "support_escalation", "onboarding"] },
                    reason: { type: "string" },
                    changes: { type: "object", description: "Structured changes to apply" },
                  },
                  required: ["workflow_type", "reason"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["adaptations", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_adaptations" } };

    } else if (task_type === "model_training") {
      systemPrompt = `You are an ML training simulation AI for a digital agency CRM. Simulate training a ${payload?.model_type || "predictive"} model on the provided business data. Return realistic training metrics including data size, accuracy score, and a summary of what the model learned.`;
      userPrompt = `Simulate training a ${payload?.model_type} model:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "training_result",
          description: "Return model training results",
          parameters: {
            type: "object",
            properties: {
              data_size: { type: "number", description: "Number of training samples used" },
              accuracy: { type: "number", description: "Model accuracy 0-100" },
              summary: { type: "string" },
              key_features: { type: "array", items: { type: "string" } },
            },
            required: ["data_size", "accuracy", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "training_result" } };

    } else if (task_type === "agent_execute_run") {
      systemPrompt = `You are an autonomous AI agent executor for a digital agency CRM. Given the agent type and input context, plan and produce a list of atomic actions the agent should take. For each action specify: action_type, target_table (if applicable), payload, and whether it requires_approval (true for HIGH risk actions like sending external messages, creating invoices, deleting records; false for LOW risk like creating internal tasks or notes). Return a confidence score for the overall plan.`;
      userPrompt = `Execute agent run with this context:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "plan_agent_run",
          description: "Return planned actions for the agent run",
          parameters: {
            type: "object",
            properties: {
              confidence_score: { type: "number", description: "Overall confidence 0-100" },
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action_type: { type: "string" },
                    target_table: { type: "string" },
                    payload: { type: "object" },
                    requires_approval: { type: "boolean" },
                    reasoning: { type: "string" },
                  },
                  required: ["action_type", "reasoning"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["confidence_score", "actions", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "plan_agent_run" } };

    } else if (task_type === "ticket_analysis") {
      systemPrompt = `You are an AI customer service analyst. Analyze the support ticket and provide: sentiment, priority recommendation, category, suggested tags, a brief summary, and a suggested reply. Be concise and actionable.`;
      userPrompt = `Analyze this support ticket:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "analyze_ticket",
          description: "Return ticket analysis with AI recommendations",
          parameters: {
            type: "object",
            properties: {
              sentiment: { type: "string", enum: ["positive", "neutral", "negative", "frustrated", "urgent"] },
              recommended_priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
              category: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              summary: { type: "string", description: "2-3 sentence summary" },
              suggested_reply: { type: "string", description: "Professional reply suggestion" },
              escalation_risk: { type: "number", description: "0-100 risk of escalation" },
              suggested_department: { type: "string" },
            },
            required: ["sentiment", "recommended_priority", "category", "tags", "summary", "suggested_reply", "escalation_risk"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "analyze_ticket" } };

    } else if (task_type === "kb_search") {
      systemPrompt = `You are a knowledge base AI assistant. Given a customer query and a list of available KB articles, recommend the most relevant articles and generate a helpful answer. If no articles match well, generate a helpful response from your knowledge.`;
      userPrompt = `Customer query: "${payload?.query}"\n\nAvailable KB articles:\n${JSON.stringify(payload?.articles || [])}`;
      tools = [{
        type: "function",
        function: {
          name: "kb_answer",
          description: "Return KB search results and AI-generated answer",
          parameters: {
            type: "object",
            properties: {
              answer: { type: "string", description: "Helpful answer to the customer query" },
              relevant_article_ids: { type: "array", items: { type: "string" }, description: "IDs of relevant articles" },
              confidence: { type: "number", description: "0-100 confidence in the answer" },
            },
            required: ["answer", "confidence"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "kb_answer" } };

    } else if (task_type === "ticket_reply_suggest") {
      systemPrompt = `You are a professional customer service AI. Based on the ticket context and conversation history, generate 3 reply options: a concise reply, a detailed reply, and an empathetic reply. Each should be professional, helpful, and resolve the customer's issue.`;
      userPrompt = `Generate reply suggestions for this ticket:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "suggest_replies",
          description: "Return 3 reply suggestions",
          parameters: {
            type: "object",
            properties: {
              replies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    style: { type: "string", enum: ["concise", "detailed", "empathetic"] },
                    text: { type: "string" },
                  },
                  required: ["style", "text"],
                  additionalProperties: false,
                },
              },
            },
            required: ["replies"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_replies" } };

    } else if (task_type === "seo_advisor") {
      const pd = payload?.project_data || payload;
      systemPrompt = `You are an expert SEO consultant for a digital agency. Analyze the SEO project data and provide 3-5 actionable recommendations. Consider: keyword strategy, content gaps, technical issues, local SEO opportunities, competitor positioning, and link building.`;
      userPrompt = `Analyze this SEO project and provide recommendations:\n${JSON.stringify(pd)}`;
      tools = [{
        type: "function",
        function: {
          name: "seo_advisor_recommendations",
          description: "Return 3-5 actionable SEO recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["KEYWORD_OPPORTUNITY", "CONTENT_GAP", "TECHNICAL_ISSUE", "LOCAL_SEO", "LINK_BUILDING", "OPTIMIZATION"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                  },
                  required: ["type", "title", "description", "priority"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "seo_advisor_recommendations" } };

    } else {
      return new Response(JSON.stringify({ error: "Unknown task_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };
    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      throw new Error(`AI gateway error [${aiResp.status}]: ${errText}`);
    }

    const aiData = await aiResp.json();

    // Extract tool call result
    let result: any = null;
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    if (toolCalls?.[0]?.function?.arguments) {
      try {
        result = JSON.parse(toolCalls[0].function.arguments);
      } catch {
        result = { raw: toolCalls[0].function.arguments };
      }
    } else {
      result = { raw: aiData.choices?.[0]?.message?.content || "" };
    }

    return new Response(JSON.stringify({ task_type, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
