import os
import asyncio
import pydantic
from typing import List, Dict, Any, Optional

# --- Pydantic Models for Structured Output ---

class DatabaseTableColumn(pydantic.BaseModel):
    name: str
    type: str
    constraints: Optional[str] = None

class DatabaseTable(pydantic.BaseModel):
    name: str
    description: str
    columns: List[DatabaseTableColumn]
    sample_records: List[Dict[str, Any]]

class DatabaseSchema(pydantic.BaseModel):
    tables: List[DatabaseTable]
    relationships: List[str]

class HslColor(pydantic.BaseModel):
    h: int
    s: int
    l: int

class ColorPalette(pydantic.BaseModel):
    primary: HslColor
    secondary: HslColor
    accent: HslColor
    background: HslColor
    card_bg: HslColor

class DashboardWidget(pydantic.BaseModel):
    id: str
    title: str
    type: str  # "stats_card", "chart", "table", "recent_activity", "scheduler"
    width: str  # "full", "half", "third"
    config: Dict[str, Any]

class UIThemeConfig(pydantic.BaseModel):
    palette: ColorPalette
    dark_mode: bool
    sidebar_layout: List[str]
    widgets: List[DashboardWidget]

class PersonaConfig(pydantic.BaseModel):
    name: str
    system_prompt: str
    tone_guidelines: List[str]
    suggested_faq: List[Dict[str, str]]
    reviews_auto_reply_template: str

# Unified response containing all custom builds
class OnboardingResult(pydantic.BaseModel):
    is_mock: bool
    database_schema: DatabaseSchema
    ui_theme: UIThemeConfig
    persona: PersonaConfig
    logs: List[str]

# --- Real Antigravity Agents Execution ---

async def run_database_agent(industry: str, features: List[str], api_key: Optional[str]) -> DatabaseSchema:
    from google.antigravity import Agent, LocalAgentConfig
    
    config = LocalAgentConfig(
        response_schema=DatabaseSchema,
        api_key=api_key,
        system_instructions=(
            "You are an expert Database Architect Agent. Create a database schema with 3-4 custom tables, "
            "columns, constraints, and 3 sample rows per table, tailored perfectly to the given business industry and features. "
            "Avoid overly generic tables; make them highly industry-specific."
        )
    )
    async with Agent(config) as agent:
        prompt = (
            f"Generate a customized database schema for a business in the '{industry}' industry. "
            f"Focus on these active features: {', '.join(features)}."
        )
        response = await agent.chat(prompt)
        return await response.structured_output()

async def run_ui_theme_agent(industry: str, tone: str, primary_color: str, features: List[str], api_key: Optional[str]) -> UIThemeConfig:
    from google.antigravity import Agent, LocalAgentConfig
    
    config = LocalAgentConfig(
        response_schema=UIThemeConfig,
        api_key=api_key,
        system_instructions=(
            "You are an expert UI/UX Design Agent. Generate a color palette (in HSL format) and a set of "
            "dashboard widgets tailored to the business type and tone. The color palette must base its primary hue on "
            "the user's requested color name (e.g., if purple, H=270; if orange, H=30; if blue, H=210; if green, H=140). "
            "Return highly customized dashboard widgets (stats, charts, tables) relevant to their daily operations."
        )
    )
    async with Agent(config) as agent:
        prompt = (
            f"Create a custom UI and widget theme for a business in the '{industry}' industry with a '{tone}' tone "
            f"and primary color theme '{primary_color}'. Active features: {', '.join(features)}."
        )
        response = await agent.chat(prompt)
        return await response.structured_output()

async def run_persona_agent(company_name: str, industry: str, tone: str, language: str, api_key: Optional[str]) -> PersonaConfig:
    from google.antigravity import Agent, LocalAgentConfig
    
    config = LocalAgentConfig(
        response_schema=PersonaConfig,
        api_key=api_key,
        system_instructions=(
            "You are an expert AI Communication Specialist Agent. Generate a custom persona and system instructions "
            f"for a customer-facing chatbot. ALL generated text fields (name, system_prompt, tone_guidelines, suggested_faq, "
            f"and reviews_auto_reply_template) MUST be written in the '{language}' language. If language is not English, "
            f"translate all output text fields, rules, and suggested answers into '{language}'."
        )
    )
    async with Agent(config) as agent:
        prompt = f"Generate a custom AI Persona config for a company named '{company_name}' in the '{industry}' industry with a '{tone}' tone in '{language}' language."
        response = await agent.chat(prompt)
        return await response.structured_output()

# --- Mock Fallbacks for Demo / Offline Mode ---

def get_mock_database_schema(industry: str, features: List[str]) -> DatabaseSchema:
    ind = industry.lower()
    if "landscap" in ind:
        return DatabaseSchema(
            tables=[
                DatabaseTable(
                    name="clients",
                    description="Stores contact details of lawn care and landscaping clients.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="name", type="TEXT", constraints="NOT NULL"),
                        DatabaseTableColumn(name="phone", type="TEXT"),
                        DatabaseTableColumn(name="address", type="TEXT"),
                        DatabaseTableColumn(name="status", type="TEXT", constraints="DEFAULT 'Active'")
                    ],
                    sample_records=[
                        {"id": 1, "name": "Sarah Jenkins", "phone": "555-0199", "address": "124 Maple Ave", "status": "Active"},
                        {"id": 2, "name": "Robert Miller", "phone": "555-3829", "address": "89 Pine Rd", "status": "Active"},
                        {"id": 3, "name": "Oakridge HOA", "phone": "555-8811", "address": "400 Oakridge Blvd", "status": "Active"}
                    ]
                ),
                DatabaseTable(
                    name="jobs",
                    description="Tracks landscaping jobs, schedules, prices, and status.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="client_id", type="INTEGER", constraints="REFERENCES clients(id)"),
                        DatabaseTableColumn(name="service_type", type="TEXT"),
                        DatabaseTableColumn(name="scheduled_date", type="TEXT"),
                        DatabaseTableColumn(name="price", type="REAL"),
                        DatabaseTableColumn(name="status", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "client_id": 1, "service_type": "Mowing & Edging", "scheduled_date": "2026-06-18", "price": 65.0, "status": "Scheduled"},
                        {"id": 2, "client_id": 2, "service_type": "Mulching & Weed Control", "scheduled_date": "2026-06-19", "price": 250.0, "status": "Scheduled"},
                        {"id": 3, "client_id": 3, "service_type": "Tree Trimming", "scheduled_date": "2026-06-15", "price": 450.0, "status": "Completed"}
                    ]
                ),
                DatabaseTable(
                    name="crew_assignments",
                    description="Assigns working crews to scheduled jobs.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="job_id", type="INTEGER", constraints="REFERENCES jobs(id)"),
                        DatabaseTableColumn(name="crew_name", type="TEXT"),
                        DatabaseTableColumn(name="lead_worker", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "job_id": 1, "crew_name": "East Crew", "lead_worker": "Carlos Santana"},
                        {"id": 2, "job_id": 2, "crew_name": "West Crew", "lead_worker": "Jake Gyllenhaal"},
                        {"id": 3, "job_id": 3, "crew_name": "Tree Crew", "lead_worker": "Bruce Willis"}
                    ]
                )
            ],
            relationships=["jobs.client_id -> clients.id", "crew_assignments.job_id -> jobs.id"]
        )
    elif "retail" in ind or "boutique" in ind or "shop" in ind:
        return DatabaseSchema(
            tables=[
                DatabaseTable(
                    name="products",
                    description="Manages clothing, accessories, and stock levels.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="sku", type="TEXT", constraints="UNIQUE NOT NULL"),
                        DatabaseTableColumn(name="name", type="TEXT", constraints="NOT NULL"),
                        DatabaseTableColumn(name="price", type="REAL"),
                        DatabaseTableColumn(name="stock", type="INTEGER")
                    ],
                    sample_records=[
                        {"id": 1, "sku": "TSH-COT-M", "name": "Organic Cotton Tee (Medium)", "price": 34.0, "stock": 45},
                        {"id": 2, "sku": "DNM-SLM-32", "name": "Slim Fit Denim (Size 32)", "price": 88.0, "stock": 18},
                        {"id": 3, "sku": "JKT-LDR-L", "name": "Classic Leather Jacket (Large)", "price": 220.0, "stock": 5}
                    ]
                ),
                DatabaseTable(
                    name="orders",
                    description="Tracks customer purchases.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="order_date", type="TEXT"),
                        DatabaseTableColumn(name="total_amount", type="REAL"),
                        DatabaseTableColumn(name="status", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1001, "order_date": "2026-06-16", "total_amount": 122.0, "status": "Shipped"},
                        {"id": 1002, "order_date": "2026-06-16", "total_amount": 220.0, "status": "Processing"},
                        {"id": 1003, "order_date": "2026-06-15", "total_amount": 34.0, "status": "Delivered"}
                    ]
                ),
                DatabaseTable(
                    name="order_items",
                    description="Bridges products and orders with quantities purchased.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="order_id", type="INTEGER", constraints="REFERENCES orders(id)"),
                        DatabaseTableColumn(name="product_id", type="INTEGER", constraints="REFERENCES products(id)"),
                        DatabaseTableColumn(name="quantity", type="INTEGER")
                    ],
                    sample_records=[
                        {"id": 1, "order_id": 1001, "product_id": 1, "quantity": 1},
                        {"id": 2, "order_id": 1001, "product_id": 2, "quantity": 1},
                        {"id": 3, "order_id": 1002, "product_id": 3, "quantity": 1}
                    ]
                )
            ],
            relationships=["order_items.order_id -> orders.id", "order_items.product_id -> products.id"]
        )
    elif "tech" in ind or "startup" in ind:
        return DatabaseSchema(
            tables=[
                DatabaseTable(
                    name="users",
                    description="Stores application user accounts and subscription status.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="email", type="TEXT", constraints="UNIQUE NOT NULL"),
                        DatabaseTableColumn(name="name", type="TEXT"),
                        DatabaseTableColumn(name="plan", type="TEXT", constraints="DEFAULT 'Developer'"),
                        DatabaseTableColumn(name="status", type="TEXT", constraints="DEFAULT 'Active'")
                    ],
                    sample_records=[
                        {"id": 1, "email": "alice@vance.io", "name": "Alice Vance", "plan": "Scale", "status": "Active"},
                        {"id": 2, "email": "bob@chen.dev", "name": "Bob Chen", "plan": "Developer", "status": "Active"},
                        {"id": 3, "email": "charlie@root.org", "name": "Charlie Root", "plan": "Enterprise", "status": "Active"}
                    ]
                ),
                DatabaseTable(
                    name="billing_subscriptions",
                    description="Tracks monthly recurring revenue subscriptions for users.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="user_id", type="INTEGER", constraints="REFERENCES users(id)"),
                        DatabaseTableColumn(name="amount", type="REAL"),
                        DatabaseTableColumn(name="billing_cycle", type="TEXT"),
                        DatabaseTableColumn(name="next_payment", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "user_id": 1, "amount": 99.00, "billing_cycle": "Monthly", "next_payment": "2026-07-01"},
                        {"id": 2, "user_id": 2, "amount": 29.00, "billing_cycle": "Monthly", "next_payment": "2026-06-30"},
                        {"id": 3, "user_id": 3, "amount": 499.00, "billing_cycle": "Monthly", "next_payment": "2026-07-15"}
                    ]
                ),
                DatabaseTable(
                    name="api_keys",
                    description="Manages developers API access tokens and request counts.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="user_id", type="INTEGER", constraints="REFERENCES users(id)"),
                        DatabaseTableColumn(name="key_prefix", type="TEXT"),
                        DatabaseTableColumn(name="requests_count", type="INTEGER"),
                        DatabaseTableColumn(name="status", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "user_id": 1, "key_prefix": "sk_live_a1b2", "requests_count": 15420, "status": "Active"},
                        {"id": 2, "user_id": 2, "key_prefix": "sk_dev_c3d4", "requests_count": 2310, "status": "Active"},
                        {"id": 3, "user_id": 3, "key_prefix": "sk_live_e5f6", "requests_count": 89400, "status": "Active"}
                    ]
                )
            ],
            relationships=["billing_subscriptions.user_id -> users.id", "api_keys.user_id -> users.id"]
        )
    elif "restaurant" in ind or "cafe" in ind or "food" in ind:
        return DatabaseSchema(
            tables=[
                DatabaseTable(
                    name="menu_items",
                    description="Manages kitchen dishes, categories, pricing, and availability.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="name", type="TEXT", constraints="NOT NULL"),
                        DatabaseTableColumn(name="category", type="TEXT"),
                        DatabaseTableColumn(name="price", type="REAL"),
                        DatabaseTableColumn(name="is_available", type="INTEGER", constraints="DEFAULT 1")
                    ],
                    sample_records=[
                        {"id": 1, "name": "Truffle Tagliatelle", "category": "Entree", "price": 24.50, "is_available": 1},
                        {"id": 2, "name": "Prosciutto Crostini", "category": "Appetizer", "price": 14.00, "is_available": 1},
                        {"id": 3, "name": "Vanilla Bean Panna Cotta", "category": "Dessert", "price": 10.50, "is_available": 1}
                    ]
                ),
                DatabaseTable(
                    name="reservations",
                    description="Tracks dining table bookings and party allocations.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="guest_name", type="TEXT", constraints="NOT NULL"),
                        DatabaseTableColumn(name="party_size", type="INTEGER"),
                        DatabaseTableColumn(name="reservation_time", type="TEXT"),
                        DatabaseTableColumn(name="table_number", type="INTEGER"),
                        DatabaseTableColumn(name="status", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "guest_name": "Sophia Loren", "party_size": 4, "reservation_time": "19:00", "table_number": 12, "status": "Confirmed"},
                        {"id": 2, "guest_name": "Marcello Mastroianni", "party_size": 2, "reservation_time": "20:30", "table_number": 5, "status": "Seated"},
                        {"id": 3, "guest_name": "Gina Lollobrigida", "party_size": 6, "reservation_time": "18:30", "table_number": 8, "status": "Cancelled"}
                    ]
                ),
                DatabaseTable(
                    name="orders",
                    description="Tracks guest order checks, payment totals, and dining type.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="order_time", type="TEXT"),
                        DatabaseTableColumn(name="total_amount", type="REAL"),
                        DatabaseTableColumn(name="type", type="TEXT"),
                        DatabaseTableColumn(name="status", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "order_time": "18:45", "total_amount": 73.00, "type": "Dine-In", "status": "Completed"},
                        {"id": 2, "order_time": "19:15", "total_amount": 38.50, "type": "Takeout", "status": "Processing"},
                        {"id": 3, "order_time": "19:40", "total_amount": 112.00, "type": "Dine-In", "status": "Pending"}
                    ]
                )
            ],
            relationships=[]
        )
    else:  # Default/Tech/General
        return DatabaseSchema(
            tables=[
                DatabaseTable(
                    name="users",
                    description="Stores application user accounts.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="email", type="TEXT", constraints="UNIQUE NOT NULL"),
                        DatabaseTableColumn(name="name", type="TEXT"),
                        DatabaseTableColumn(name="role", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "email": "admin@company.com", "name": "Jane Doe", "role": "Administrator"},
                        {"id": 2, "email": "support@company.com", "name": "Alex Smith", "role": "Support Rep"},
                        {"id": 3, "email": "sales@company.com", "name": "Marcus Aurelius", "role": "Sales Exec"}
                    ]
                ),
                DatabaseTable(
                    name="leads",
                    description="Tracks sales opportunities and prospective clients.",
                    columns=[
                        DatabaseTableColumn(name="id", type="INTEGER", constraints="PRIMARY KEY AUTOINCREMENT"),
                        DatabaseTableColumn(name="company", type="TEXT"),
                        DatabaseTableColumn(name="value", type="REAL"),
                        DatabaseTableColumn(name="status", type="TEXT")
                    ],
                    sample_records=[
                        {"id": 1, "company": "CyberDyne Systems", "value": 50000.0, "status": "Negotiation"},
                        {"id": 2, "company": "Stark Industries", "value": 150000.0, "status": "Proposal Sent"},
                        {"id": 3, "company": "Wayne Enterprises", "value": 75000.0, "status": "Contacted"}
                    ]
                )
            ],
            relationships=[]
        )

def get_mock_ui_theme_config(industry: str, tone: str, primary_color: str, features: List[str]) -> UIThemeConfig:
    # Map primary color to HSL
    color_map = {
        "purple": HslColor(h=270, s=80, l=60),
        "orange": HslColor(h=25, s=95, l=55),
        "blue": HslColor(h=215, s=90, l=55),
        "green": HslColor(h=142, s=70, l=45),
        "red": HslColor(h=0, s=85, l=55),
        "cyan": HslColor(h=190, s=90, l=45)
    }
    
    selected_p = color_map.get(primary_color.lower(), HslColor(h=215, s=90, l=55))
    
    # Generate logical colors based on selected primary
    secondary = HslColor(h=(selected_p.h + 30) % 360, s=selected_p.s - 20, l=selected_p.l)
    accent = HslColor(h=(selected_p.h + 180) % 360, s=selected_p.s, l=selected_p.l)
    background = HslColor(h=selected_p.h, s=15, l=8)  # Deep dark base
    card_bg = HslColor(h=selected_p.h, s=15, l=14)   # Slightly lighter card base
    
    palette = ColorPalette(
        primary=selected_p,
        secondary=secondary,
        accent=accent,
        background=background,
        card_bg=card_bg
    )
    
    ind = industry.lower()
    widgets = []
    
    # Pre-select sidebar layout
    sidebar = ["Overview", "Database", "Chat Playground"]
    if "payroll" in [f.lower() for f in features] or "expenses" in [f.lower() for f in features]:
        sidebar.append("Back-Office")
    if "seo" in [f.lower() for f in features] or "textback" in [f.lower() for f in features]:
        sidebar.append("Growth Suite")
    
    # Construct widgets depending on industry
    if "landscap" in ind:
        widgets = [
            DashboardWidget(
                id="stat-jobs",
                title="Active Jobs",
                type="stats_card",
                width="third",
                config={"value": "14", "change": "+8% this week", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-revenue",
                title="Weekly Estimates",
                type="stats_card",
                width="third",
                config={"value": "$4,250", "change": "Pending approval", "trend": "neutral"}
            ),
            DashboardWidget(
                id="stat-reviews",
                title="Review Rating",
                type="stats_card",
                width="third",
                config={"value": "4.9 ★", "change": "3 new reviews today", "trend": "up"}
            ),
            DashboardWidget(
                id="jobs-scheduler",
                title="Crew Schedule",
                type="scheduler",
                width="half",
                config={"crews": ["East Crew", "West Crew", "Tree Crew"], "time_slots": "Daily"}
            ),
            DashboardWidget(
                id="recent-bookings",
                title="Recent Leads & Inquiries",
                type="recent_activity",
                width="half",
                config={"items": ["Mulching (Sarah Jenkins) - Pending", "Tree Removal (Wayne HOA) - Approved"]}
            )
        ]
    elif "retail" in ind or "boutique" in ind or "shop" in ind:
        widgets = [
            DashboardWidget(
                id="stat-sales",
                title="Today's Sales",
                type="stats_card",
                width="third",
                config={"value": "$1,890", "change": "+12% vs yesterday", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-orders",
                title="Active Orders",
                type="stats_card",
                width="third",
                config={"value": "27", "change": "8 in processing", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-inventory",
                title="Low Stock Items",
                type="stats_card",
                width="third",
                config={"value": "4 SKUs", "change": "Alert: Reorder classic tee", "trend": "down"}
            ),
            DashboardWidget(
                id="sales-chart",
                title="Hourly Order Volume",
                type="chart",
                width="half",
                config={"chart_type": "bar", "labels": ["9AM", "12PM", "3PM", "6PM"], "data": [12, 34, 45, 22]}
            ),
            DashboardWidget(
                id="recent-orders-list",
                title="Recent Customer Orders",
                type="table",
                width="half",
                config={"headers": ["Order ID", "Amount", "Status"], "rows": [["#1028", "$122.00", "Shipped"], ["#1029", "$45.00", "Processing"]]}
            )
        ]
    elif "tech" in ind or "startup" in ind:
        widgets = [
            DashboardWidget(
                id="stat-mrr",
                title="Monthly Recurring Revenue",
                type="stats_card",
                width="third",
                config={"value": "$12,450", "change": "+14% this month", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-active-subs",
                title="Active Subscriptions",
                type="stats_card",
                width="third",
                config={"value": "142", "change": "+12 new this week", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-api-health",
                title="API Health Status",
                type="stats_card",
                width="third",
                config={"value": "99.99%", "change": "All systems operational", "trend": "neutral"}
            ),
            DashboardWidget(
                id="api-traffic-chart",
                title="API Traffic History (K reqs)",
                type="chart",
                width="half",
                config={"chart_type": "line", "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"], "data": [12, 18, 15, 24, 32]}
            ),
            DashboardWidget(
                id="recent-tickets-table",
                title="Recent Support Tickets",
                type="table",
                width="half",
                config={"headers": ["User", "Subject", "Status"], "rows": [["alice@vance.io", "Invoicing support", "Open"], ["bob@chen.dev", "Rate limiting error", "Closed"]]}
            )
        ]
    elif "restaurant" in ind or "cafe" in ind or "food" in ind:
        widgets = [
            DashboardWidget(
                id="stat-revenue",
                title="Today's Sales",
                type="stats_card",
                width="third",
                config={"value": "$1,450", "change": "+8% vs last week", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-bookings",
                title="Table Reservations",
                type="stats_card",
                width="third",
                config={"value": "18 Bookings", "change": "6 tables remaining", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-avg-ticket",
                title="Average Ticket",
                type="stats_card",
                width="third",
                config={"value": "$42.50", "change": "+3.2% increase", "trend": "up"}
            ),
            DashboardWidget(
                id="peak-hours-chart",
                title="Hourly Order Count",
                type="chart",
                width="half",
                config={"chart_type": "bar", "labels": ["12 PM", "2 PM", "6 PM", "8 PM", "10 PM"], "data": [24, 12, 45, 68, 30]}
            ),
            DashboardWidget(
                id="active-tables-list",
                title="Seated Guests Overview",
                type="table",
                width="half",
                config={"headers": ["Table", "Guest Name", "Status"], "rows": [["Table 5", "Marcello M.", "Main Course"], ["Table 12", "Sophia Loren", "Appetizer"]]}
            )
        ]
    else:  # Generic/Tech
        widgets = [
            DashboardWidget(
                id="stat-leads",
                title="Pipeline Leads",
                type="stats_card",
                width="third",
                config={"value": "42", "change": "+5 new leads today", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-conversion",
                title="Conversion Rate",
                type="stats_card",
                width="third",
                config={"value": "4.2%", "change": "+0.4% this month", "trend": "up"}
            ),
            DashboardWidget(
                id="stat-uptime",
                title="Platform Status",
                type="stats_card",
                width="third",
                config={"value": "99.98%", "change": "Healthy", "trend": "neutral"}
            ),
            DashboardWidget(
                id="funnel-chart",
                title="Lead Funnel",
                type="chart",
                width="half",
                config={"chart_type": "line", "labels": ["Jan", "Feb", "Mar", "Apr"], "data": [100, 120, 150, 180]}
            )
        ]
        
    return UIThemeConfig(
        palette=palette,
        dark_mode=True,
        sidebar_layout=sidebar,
        widgets=widgets
    )

def get_mock_persona_config(company_name: str, industry: str, tone: str, language: str = "English") -> PersonaConfig:
    ind = industry.lower()
    t = tone.lower()
    lang = language.lower()
    
    if "spanish" in lang or "español" in lang:
        if "landscap" in ind:
            assistant_name = "EcoAsistente" if "friendly" in t else "GreenLine AI"
            reviews_auto_reply_template = (
                "¡Hola {customer_name}! ¡Muchísimas gracias por la calificación de {rating} estrellas! "
                "A nuestro equipo (especialmente al líder de césped Carlos) le encanta mantener su espacio exterior impecable. "
                "Si alguna vez necesita limpieza adicional, mantillo o poda de árboles, ¡no dude en contactarnos! - El equipo de {company_name}"
            )
            tone_rules = [
                "Sea siempre amable, profesional y conocedor de la horticultura local.",
                "Utilice metáforas naturales de paisajismo cuando sea apropiado.",
                "Ofrezca siempre programar un presupuesto o una reserva de equipo."
            ]
            suggested_faq = [
                {"question": "¿Cuánto cuesta un presupuesto para el césped?", "answer": "¡Todos los presupuestos iniciales son 100% gratuitos! Evaluaremos su terreno y le enviaremos el presupuesto digital en 24 horas."},
                {"question": "¿Tienen licencia y están asegurados?", "answer": "Sí, contamos con licencia completa y una póliza de seguro de responsabilidad civil de $2M para su total tranquilidad."}
            ]
        elif "retail" in ind or "boutique" in ind or "shop" in ind:
            assistant_name = "EstiloBot" if "friendly" in t else "Luxe Bot"
            reviews_auto_reply_template = (
                "¡Hola {customer_name}! ¡Estamos absolutamente encantados de que haya disfrutado de su experiencia de compra con nosotros! "
                "Nos esforzamos por ofrecer artículos de la mejor calidad. ¡Asegúrese de revisar nuestra nueva colección la próxima semana! Con cariño, {company_name}"
            )
            tone_rules = [
                "Sea muy elegante, acogedor, a la moda y profesional.",
                "Diríjase a los clientes por su nombre y refiérase a la ropa como 'colecciones seleccionadas'.",
                "Resuelva rápidamente las preguntas sobre inventario y envíos."
            ]
            suggested_faq = [
                {"question": "¿Cuál es su política de devoluciones?", "answer": "Aceptamos devoluciones de artículos sin usar con etiquetas originales dentro de los 30 días para crédito o reembolso."},
                {"question": "¿Cuánto tarda el envío?", "answer": "El envío estándar tarda de 3 a 5 días hábiles. Las opciones exprés están disponibles al pagar."}
            ]
        elif "tech" in ind or "startup" in ind:
            assistant_name = "SocioDev"
            reviews_auto_reply_template = (
                "¡Hola {customer_name}! Agradecemos su reseña de {rating} estrellas. "
                "Nuestro equipo de desarrollo trabaja arduamente para mantener el tiempo de actividad y la API estable. "
                "¡Gracias por confiar en {company_name}! - El equipo técnico"
            )
            tone_rules = [
                "Sea técnico, servicial, objetivo y profesional.",
                "Resuelva dudas de la API haciendo referencia a la consola."
            ]
            suggested_faq = [
                {"question": "¿Cómo genero mi clave API?", "answer": "Puede generar claves API en la sección de Claves del sistema dentro del panel de Back-Office."},
                {"question": "¿Cuál es su acuerdo de nivel de servicio (SLA)?", "answer": "Garantizamos un tiempo de actividad del 99.9% mensual para todos nuestros servicios REST."}
            ]
        elif "restaurant" in ind or "cafe" in ind or "food" in ind:
            assistant_name = "MaitreD AI"
            reviews_auto_reply_template = (
                "Estimado/a {customer_name}, muchas gracias por su reseña de {rating} estrellas. "
                "Nos alegra mucho saber que disfrutó de su cena. ¡Esperamos verle pronto de nuevo en {company_name}! Buen provecho."
            )
            tone_rules = [
                "Sea excepcionalmente cortés, hospitalario, elegante y formal.",
                "Utilice saludos refinados e invite a los clientes a regresar."
            ]
            suggested_faq = [
                {"question": "¿Tienen opciones vegetarianas?", "answer": "Sí, nuestro menú cuenta con opciones vegetarianas y sin gluten detalladas. Pregunte a su camarero."},
                {"question": "¿Se requiere reservar mesa?", "answer": "Recomendamos reservar mesa para el servicio de cena de los fines de semana, pero también atendemos por orden de llegada."}
            ]
        else:
            assistant_name = "OmniBot"
            reviews_auto_reply_template = (
                "¡Gracias {customer_name} por sus comentarios! Estamos dedicados a brindar un servicio excelente. Atentamente, {company_name}"
            )
            tone_rules = ["Sea claro, conciso, objetivo y orientado a soluciones."]
            suggested_faq = [{"question": "¿Cómo puedo contactar al soporte?", "answer": "Puede contactarnos 24/7 por correo electrónico a support@company.com."}]
    elif "chinese" in lang or "中文" in lang:
        if "landscap" in ind:
            assistant_name = "绿化助手"
            reviews_auto_reply_template = (
                "您好 {customer_name}！非常感谢您的 {rating} 星好评！"
                "我们的团队非常高兴能为您的庭院保驾护航。如果您需要割草、修剪或施肥服务，请随时与我们联系！ - {company_name} 团队"
            )
            tone_rules = ["始终保持热情、专业，并具备园艺知识。", "适时提供修剪或维护建议。"]
            suggested_faq = [
                {"question": "上门估价收费吗？", "answer": "所有首次上门估价均 100% 免费！我们将在评估后 24 小时内向您发送数字报价单。"},
                {"question": "你们有营业执照和保险吗？", "answer": "是的，我们拥有完整的执照和 200 万美元的责任保险，确保安全无忧。"}
            ]
        elif "tech" in ind or "startup" in ind:
            assistant_name = "研发客服"
            reviews_auto_reply_template = (
                "您好 {customer_name}！感谢您的 {rating} 星评价。我们致力于提供高可用、低延迟的API服务。谢谢您对 {company_name} 的支持！"
            )
            tone_rules = ["保持专业、严谨的技术服务态度。"]
            suggested_faq = [
                {"question": "如何获取API密钥？", "answer": "您可以在后台系统的 API 密钥栏目中生成。"},
                {"question": "服务在线率是多少？", "answer": "我们提供 99.9% 的服务在线率保证。"}
            ]
        elif "restaurant" in ind or "cafe" in ind or "food" in ind:
            assistant_name = "订位经理 AI"
            reviews_auto_reply_template = (
                "您好 {customer_name}，非常感谢您的 {rating} 星好评！很高兴您能满意我们的菜品与服务。期待您再次光临 {company_name}！祝您用餐愉快。"
            )
            tone_rules = ["保持极其热情、礼貌和款待的态度。"]
            suggested_faq = [
                {"question": "可以预订多人桌吗？", "answer": "是的，我们接受在线预订，最多可承接大堂和包间的多人聚餐。"},
                {"question": "营业时间是几点？", "answer": "我们每天上午 11:30 至晚上 10:00 营业。"}
            ]
        else:
            assistant_name = "智能助手"
            reviews_auto_reply_template = (
                "感谢 {customer_name} 的反馈！我们致力于为您提供最优质的服务。 - {company_name} 团队"
            )
            tone_rules = ["保持客观、清晰、高效的沟通。"]
            suggested_faq = [{"question": "如何联系客服？", "answer": "您可以发送电子邮件至 support@company.com 联系我们。"}]
    elif "french" in lang or "français" in lang:
        if "landscap" in ind:
            assistant_name = "ÉcoAssistant"
            reviews_auto_reply_template = (
                "Bonjour {customer_name} ! Merci infiniment pour votre évaluation de {rating} étoiles ! "
                "Notre équipe adore garder votre espace vert impeccable. Si vous avez besoin d'autres services, n'hésitez pas ! - L'équipe {company_name}"
            )
            tone_rules = ["Soyez toujours courtois, chaleureux et professionnel."]
            suggested_faq = [
                {"question": "Combien coûte un devis ?", "answer": "Tous les devis initiaux sont 100% gratuits ! Nous vous enverrons un devis sous 24h."},
                {"question": "Êtes-vous assuré ?", "answer": "Oui, nous sommes agréés et assurés à hauteur de 2M$ pour votre tranquillité."}
            ]
        elif "tech" in ind or "startup" in ind:
            assistant_name = "DevAssistant"
            reviews_auto_reply_template = (
                "Bonjour {customer_name}, merci pour votre note de {rating} étoiles. Notre équipe s'efforce de maintenir des API stables. Merci d'avoir choisi {company_name} !"
            )
            tone_rules = ["Soyez précis, technique et orienté solutions."]
            suggested_faq = [
                {"question": "Comment créer une clé API ?", "answer": "Vous pouvez la générer dans l'onglet Clés API de votre espace Back-Office."},
                {"question": "Quelle est la disponibilité ?", "answer": "Nous garantissons une disponibilité de 99.9%."}
            ]
        elif "restaurant" in ind or "cafe" in ind or "food" in ind:
            assistant_name = "MaîtreD AI"
            reviews_auto_reply_template = (
                "Bonjour {customer_name}, merci beaucoup pour votre avis de {rating} étoiles ! Nous sommes ravis que vous ayez passé un bon moment chez {company_name}. Au plaisir de vous revoir ! Bon appétit."
            )
            tone_rules = ["Soyez chaleureux, accueillant, élégant et poli."]
            suggested_faq = [
                {"question": "Avez-vous des plats végétariens ?", "answer": "Oui, notre menu propose plusieurs options végétariennes et végétaliennes."},
                {"question": "Faut-il réserver ?", "answer": "La réservation est vivement conseillée pour le service du soir le week-end."}
            ]
        else:
            assistant_name = "OmniBot"
            reviews_auto_reply_template = (
                "Merci {customer_name} pour votre retour ! Nous sommes dévoués à vous offrir le meilleur service. - L'équipe {company_name}"
            )
            tone_rules = ["Soyez clair, concise et efficace."]
            suggested_faq = [{"question": "Comment contacter le support ?", "answer": "Contactez-nous 24/7 par email à support@company.com."}]
    else:
        # Default English
        if "landscap" in ind:
            assistant_name = "EcoBot" if "friendly" in t else "GreenLine AI"
            reviews_auto_reply_template = (
                "Hi {customer_name}! Thank you so much for the {rating}-star rating! "
                "Our crew (especially the lawn lead Carlos) loves keeping your outdoor space looking pristine. "
                "If you ever need additional cleanup, mulching, or tree work, don't hesitate to reach out! - The {company_name} Team"
            )
            tone_rules = [
                "Always be warm, professional, and knowledgeable about local horticulture.",
                "Use natural landscaping metaphors where appropriate.",
                "Always offer to schedule an estimate or crew booking."
            ]
            suggested_faq = [
                {"question": "How much does a lawn estimate cost?", "answer": "All initial lawn estimates are 100% free! We will send a crew lead to evaluate your yard and provide a digital estimate within 24 hours."},
                {"question": "Are you licensed and insured?", "answer": "Yes, we are fully licensed and carry a $2M liability insurance policy to ensure complete safety and peace of mind for your property."}
            ]
        elif "retail" in ind or "boutique" in ind or "shop" in ind:
            assistant_name = "StylistAI" if "friendly" in t else "Luxe Bot"
            reviews_auto_reply_template = (
                "Hello {customer_name}, we are absolutely thrilled that you enjoyed your shopping experience with us! "
                "We strive to source the finest quality items, and it means the world that you noticed. "
                "Be sure to check our new arrivals collection next week! Warmly, {company_name}"
            )
            tone_rules = [
                "Be highly fashionable, trendy, welcoming, and elegant.",
                "Address customers by name and refer to apparel as 'curated collections'.",
                "Promptly resolve inventory and shipping questions."
            ]
            suggested_faq = [
                {"question": "What is your return policy?", "answer": "We accept returns of unworn items with original tags within 30 days of purchase for store credit or full refund."},
                {"question": "How long does shipping take?", "answer": "Standard shipping takes 3-5 business days. Express shipping options are available at checkout."}
            ]
        elif "tech" in ind or "startup" in ind:
            assistant_name = "DevSupport AI"
            reviews_auto_reply_template = (
                "Hello {customer_name}, thank you for the {rating}-star rating! "
                "We work hard to ensure low-latency API performance. Thanks for trusting {company_name} to power your workflow!"
            )
            tone_rules = [
                "Be highly technical, concise, clear, and helpful.",
                "Use software engineering language where appropriate."
            ]
            suggested_faq = [
                {"question": "How do I rotate my API key?", "answer": "You can revoke and regenerate your active API credentials anytime under the API Keys manager in the back-office tab."},
                {"question": "What is your uptime guarantee?", "answer": "We commit to a 99.9% uptime SLA for all core SaaS services."}
            ]
        elif "restaurant" in ind or "cafe" in ind or "food" in ind:
            assistant_name = "MaitreD AI"
            reviews_auto_reply_template = (
                "Dear {customer_name}, thank you so much for the {rating}-star rating! "
                "We are delighted that you enjoyed your dining experience at {company_name}. We look forward to hosting you again soon! Bon appétit."
            )
            tone_rules = [
                "Be exceptionally polite, hospitable, warm, and professional.",
                "Address guests with premium courtesy."
            ]
            suggested_faq = [
                {"question": "Do you cater to dietary restrictions?", "answer": "Yes, we offer a selection of vegan, gluten-free, and allergen-friendly options. Please inform your server of any preferences."},
                {"question": "How do I book a private party?", "answer": "You can reserve tables for large groups directly through the reservations planner in the back-office or by contacting our hosting manager."}
            ]
        else:
            assistant_name = "OmniBot"
            reviews_auto_reply_template = (
                "Thank you {customer_name} for your feedback! We are dedicated to providing excellent service. "
                "Please feel free to connect with our support desk if you need anything else. Best, {company_name}"
            )
            tone_rules = [
                "Be clear, concise, objective, and solution-oriented.",
                "Avoid slang; maintain a helpful, corporate-friendly tone.",
                "Provide links to documentation or tickets when resolving complex queries."
            ]
            suggested_faq = [
                {"question": "How can I contact support?", "answer": "You can reach our help desk 24/7 by clicking the ticket tab or emailing support@company.com."}
            ]
            
        # If any other language was requested (e.g. tagalog, vietnamese, arabic, etc.), translate English mock strings
        if lang != "english":
            assistant_name = f"{assistant_name} ({language})"
            reviews_auto_reply_template = f"[{language} Translation] " + reviews_auto_reply_template
            tone_rules = [f"Follow this rule in {language}: {r}" for r in tone_rules]
            suggested_faq = [{"question": f"({language}) {f['question']}", "answer": f"({language}) {f['answer']}"} for f in suggested_faq]
        
    return PersonaConfig(
        name=assistant_name,
        system_prompt=(
            f"You are {assistant_name}, the custom AI business representative for {company_name}. "
            f"Ground yourself in the following tone: {tone}. Respond in the '{language}' language."
        ),
        tone_guidelines=tone_rules,
        suggested_faq=suggested_faq,
        reviews_auto_reply_template=reviews_auto_reply_template
    )

# --- Orchestrator Orchestrating Building Flow ---

async def run_onboarding_orchestrator(
    company_name: str,
    industry: str,
    tone: str,
    primary_color: str,
    features: List[str],
    language: str = "English",
    user_api_key: Optional[str] = None
) -> OnboardingResult:
    # Resolve API Key
    api_key = user_api_key or os.environ.get("GEMINI_API_KEY")
    is_mock = not api_key
    
    logs = []
    logs.append(f"[System] Initiating onboarding sequence for '{company_name}'...")
    logs.append(f"[System] Language selected: '{language}'")
    logs.append(f"[System] Analyzing industry '{industry}' and tone profile '{tone}'...")
    logs.append("[System] Dispatching three subagents in parallel using Google Antigravity SDK...")
    
    if is_mock:
        logs.append("[Orchestrator] Running in Simulation/Demo Mode (No Gemini API Key found).")
        # Simulate agent thinking steps
        await asyncio.sleep(0.5)
        logs.append("[Subagent: SchemaArchitect] Thinking: Designing database tables for " + industry + "...")
        await asyncio.sleep(0.4)
        logs.append("[Subagent: UIThemeDesigner] Thinking: Finding complementary HSL variables for color: " + primary_color + "...")
        await asyncio.sleep(0.4)
        logs.append("[Subagent: PersonaWriter] Thinking: Generating prompt parameters in " + language + " for " + company_name + " in " + tone + " tone...")
        await asyncio.sleep(0.6)
        
        db_schema = get_mock_database_schema(industry, features)
        ui_theme = get_mock_ui_theme_config(industry, tone, primary_color, features)
        persona = get_mock_persona_config(company_name, industry, tone, language)
        
        logs.append("[Subagent: SchemaArchitect] Construction complete. Created tables: " + ", ".join([t.name for t in db_schema.tables]))
        logs.append("[Subagent: UIThemeDesigner] Design tokens established. Custom layout containing: " + ", ".join([w.title for w in ui_theme.widgets]))
        logs.append("[Subagent: PersonaWriter] Coprocessor task completed. Chat persona name: '" + persona.name + "'")
        logs.append("[System] System self-assembly complete! Booting tailored environment.")
        
        return OnboardingResult(
            is_mock=True,
            database_schema=db_schema,
            ui_theme=ui_theme,
            persona=persona,
            logs=logs
        )
    else:
        logs.append("[Orchestrator] Spawning real parallel agents via Gemini...")
        
        try:
            # Run the three agents concurrently
            db_task = run_database_agent(industry, features, api_key)
            ui_task = run_ui_theme_agent(industry, tone, primary_color, features, api_key)
            persona_task = run_persona_agent(company_name, industry, tone, language, api_key)
            
            db_schema, ui_theme, persona = await asyncio.gather(db_task, ui_task, persona_task)
            
            logs.append("[Subagent: SchemaArchitect] Success. Custom database schema defined.")
            logs.append("[Subagent: UIThemeDesigner] Success. Tailored layout and HSL color maps generated.")
            logs.append("[Subagent: PersonaWriter] Success. Customer support persona rules created.")
            logs.append("[System] System self-assembly complete! Booting custom platform.")
            
            return OnboardingResult(
                is_mock=False,
                database_schema=db_schema,
                ui_theme=ui_theme,
                persona=persona,
                logs=logs
            )
        except Exception as e:
            logs.append(f"[Error] Agent execution failed: {str(e)}. Falling back to local design schema.")
            # Fallback
            db_schema = get_mock_database_schema(industry, features)
            ui_theme = get_mock_ui_theme_config(industry, tone, primary_color, features)
            persona = get_mock_persona_config(company_name, industry, tone, language)
            
            return OnboardingResult(
                is_mock=True,
                database_schema=db_schema,
                ui_theme=ui_theme,
                persona=persona,
                logs=logs
            )
