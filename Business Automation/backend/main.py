import os
import json
import sqlite3
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

from agents import run_onboarding_orchestrator

app = FastAPI(title="OmniBiz Self-Building Agent API")

# Configure CORS so our React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Payloads ---

class OnboardingRequest(BaseModel):
    company_name: str
    industry: str
    tone: str
    primary_color: str
    features: List[str]
    language: str = "English"
    api_key: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    system_prompt: str
    api_key: Optional[str] = None
    lm_studio_url: Optional[str] = None

class QueryRequest(BaseModel):
    sql: str

class GenerateReplyRequest(BaseModel):
    review_text: str
    rating: int
    customer_name: str
    system_prompt: str
    api_key: Optional[str] = None
    lm_studio_url: Optional[str] = None

class TextbackRequest(BaseModel):
    message: str
    customer_phone: str
    system_prompt: str
    api_key: Optional[str] = None
    lm_studio_url: Optional[str] = None

# --- Helper to Write Generated Files to Frontend ---

def write_generated_files_to_frontend(data: Dict[str, Any]):
    # Define target path for frontend's generated folder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    generated_dir = os.path.join(base_dir, "frontend", "src", "generated")
    
    # Create the directory if it doesn't exist
    os.makedirs(generated_dir, exist_ok=True)
    
    # Save the files
    with open(os.path.join(generated_dir, "schema.json"), "w") as f:
        json.dump(data["database_schema"], f, indent=2)
        
    with open(os.path.join(generated_dir, "theme.json"), "w") as f:
        json.dump(data["ui_theme"], f, indent=2)
        
    with open(os.path.join(generated_dir, "persona.json"), "w") as f:
        json.dump(data["persona"], f, indent=2)

# --- SQLite Database Seeder ---

def init_sqlite_db(schema_dict: Dict[str, Any]):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    gen_dir = os.path.join(base_dir, "generated")
    os.makedirs(gen_dir, exist_ok=True)
    db_path = os.path.join(gen_dir, "business.db")
    
    # Remove existing db to rebuild fresh
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass
            
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    tables = schema_dict.get("tables", [])
    for table in tables:
        tbl_name = table.get("name")
        columns = table.get("columns", [])
        records = table.get("sample_records", [])
        
        col_sqls = []
        for col in columns:
            col_name = col.get("name")
            col_type = col.get("type")
            col_constraints = col.get("constraints")
            c_str = f" {col_constraints}" if col_constraints else ""
            col_sqls.append(f"{col_name} {col_type}{c_str}")
            
        create_sql = f"CREATE TABLE {tbl_name} ({', '.join(col_sqls)});"
        cursor.execute(create_sql)
        
        # Populate table with sample rows
        for rec in records:
            keys = list(rec.keys())
            values = [rec[k] for k in keys]
            placeholders = ", ".join(["?" for _ in keys])
            insert_sql = f"INSERT INTO {tbl_name} ({', '.join(keys)}) VALUES ({placeholders});"
            cursor.execute(insert_sql, values)
            
    conn.commit()
    conn.close()

# --- Routes ---

@app.post("/api/onboard")
async def onboard(req: OnboardingRequest):
    try:
        result = await run_onboarding_orchestrator(
            company_name=req.company_name,
            industry=req.industry,
            tone=req.tone,
            primary_color=req.primary_color,
            features=req.features,
            language=req.language,
            user_api_key=req.api_key
        )
        
        # Serialize output
        response_data = result.model_dump()
        
        # Write files to frontend directory
        write_generated_files_to_frontend(response_data)
        
        # Initialize SQLite database file on disk
        init_sqlite_db(response_data["database_schema"])
        
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Onboarding pipeline failed: {str(e)}")

@app.post("/api/query")
async def execute_query(req: QueryRequest):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "generated", "business.db")
    if not os.path.exists(db_path):
        raise HTTPException(status_code=400, detail="Database has not been compiled yet.")
        
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(req.sql)
        
        sql_lower = req.sql.strip().lower()
        if sql_lower.startswith("select"):
            rows = cursor.fetchall()
            columns = [col[0] for col in cursor.description] if cursor.description else []
            result_rows = [dict(row) for row in rows]
            conn.close()
            return {"columns": columns, "rows": result_rows}
        else:
            conn.commit()
            conn.close()
            return {"columns": [], "rows": [], "message": "Query executed successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if req.lm_studio_url:
        try:
            url = req.lm_studio_url.rstrip('/')
            headers = {"Content-Type": "application/json", "Authorization": "Bearer lm-studio"}
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": "local-model",
                    "messages": [
                        {"role": "system", "content": req.system_prompt},
                        {"role": "user", "content": req.message}
                    ],
                    "temperature": 0.7
                }
                resp = await client.post(f"{url}/chat/completions", json=payload, headers=headers, timeout=30.0)
                resp.raise_for_status()
                data = resp.json()
                if "choices" not in data:
                    return {"text": f"[LM Studio Error] Received 200 but unexpected response: {data}"}
                return {"text": data["choices"][0]["message"]["content"]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LM Studio API failure: {str(e)}")

    api_key = req.api_key or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        msg = req.message.lower()
        is_spanish = "spanish" in req.system_prompt.lower()
        
        if is_spanish:
            if "hello" in msg or "hi" in msg or "hola" in msg:
                reply = "¡Hola! Bienvenido a nuestro sistema automatizado. ¿En qué podemos ayudarle hoy?"
            elif any(k in msg for k in ["price", "cost", "quote", "precio", "costo", "cuanto", "cuánto", "cuest", "presupuesto"]):
                reply = "¡Ofrecemos presupuestos iniciales gratis! Háganos saber sus necesidades y un representante se comunicará pronto con los detalles."
            elif any(k in msg for k in ["licensed", "insure", "licencia", "seguro"]):
                reply = "Sí, contamos con licencia completa y seguro de responsabilidad civil para proteger su propiedad."
            else:
                reply = "Gracias por contactarnos. Hemos registrado su consulta y nuestro equipo de soporte se comunicará con usted en breve."
        else:
            if "hello" in msg or "hi" in msg:
                reply = "Hello there! Welcome to our automated system. How can we help you today?"
            elif any(k in msg for k in ["price", "cost", "quote"]):
                reply = "We offer free initial estimates! Let us know your requirements and a representative will follow up with pricing detail shortly."
            elif any(k in msg for k in ["licensed", "insure"]):
                reply = "Yes, we are fully licensed and insured, protecting our team and your property."
            else:
                reply = "Thank you for reaching out. We have logged your inquiry and our support team will contact you shortly."
            
        return {"text": f"[DEMO MODE - Simulated Response]\n{reply}"}
        
    try:
        from google.antigravity import Agent, LocalAgentConfig
        
        config = LocalAgentConfig(
            api_key=api_key,
            system_instructions=req.system_prompt
        )
        
        async with Agent(config) as agent:
            response = await agent.chat(req.message)
            text = await response.text()
            return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat agent failure: {str(e)}")

@app.post("/api/generate_reply")
async def generate_reply(req: GenerateReplyRequest):
    if req.lm_studio_url:
        try:
            url = req.lm_studio_url.rstrip('/')
            headers = {"Content-Type": "application/json", "Authorization": "Bearer lm-studio"}
            prompt = f"Write a professional response to this customer review from '{req.customer_name}' who rated us {req.rating} stars. Review text: '{req.review_text}'"
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": "local-model",
                    "messages": [
                        {"role": "system", "content": req.system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                }
                resp = await client.post(f"{url}/chat/completions", json=payload, headers=headers, timeout=30.0)
                resp.raise_for_status()
                data = resp.json()
                if "choices" not in data:
                    return {"text": f"[LM Studio Error] Received 200 but unexpected response: {data}"}
                return {"text": data["choices"][0]["message"]["content"]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LM Studio API failure: {str(e)}")

    api_key = req.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        is_spanish = "spanish" in req.system_prompt.lower()
        is_chinese = "chinese" in req.system_prompt.lower()
        is_french = "french" in req.system_prompt.lower()
        
        cust = req.customer_name
        rate = req.rating
        
        if is_spanish:
            reply = f"Muchas gracias {cust} por su calificación de {rate} estrellas. Agradecemos enormemente su apoyo a nuestro negocio local."
        elif is_chinese:
            reply = f"非常感谢 {cust} 给我们的 {rate} 星好评！我们非常高兴能为您提供满意的服务。"
        elif is_french:
            reply = f"Merci beaucoup {cust} pour votre note de {rate} étoiles ! Nous apprécions grandement votre soutien."
        else:
            reply = f"Thank you so much {cust} for the {rate}-star rating! We appreciate your support for our local business."
            
        return {"text": f"[DEMO MODE - Simulated Reply]\n{reply}"}
        
    try:
        from google.antigravity import Agent, LocalAgentConfig
        config = LocalAgentConfig(api_key=api_key, system_instructions=req.system_prompt)
        async with Agent(config) as agent:
            prompt = f"Write a professional response to this customer review from '{req.customer_name}' who rated us {req.rating} stars. Review text: '{req.review_text}'"
            response = await agent.chat(prompt)
            return {"text": await response.text()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/textback")
async def textback(req: TextbackRequest):
    if req.lm_studio_url:
        try:
            url = req.lm_studio_url.rstrip('/')
            headers = {"Content-Type": "application/json", "Authorization": "Bearer lm-studio"}
            prompt = f"The customer texted us from phone '{req.customer_phone}' saying: '{req.message}'. Generate an immediate auto-textback reply."
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": "local-model",
                    "messages": [
                        {"role": "system", "content": req.system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                }
                resp = await client.post(f"{url}/chat/completions", json=payload, headers=headers, timeout=30.0)
                resp.raise_for_status()
                data = resp.json()
                if "choices" not in data:
                    return {"text": f"[LM Studio Error] Received 200 but unexpected response: {data}"}
                return {"text": data["choices"][0]["message"]["content"]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LM Studio API failure: {str(e)}")

    api_key = req.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        is_spanish = "spanish" in req.system_prompt.lower()
        is_chinese = "chinese" in req.system_prompt.lower()
        is_french = "french" in req.system_prompt.lower()
        
        msg = req.message.lower()
        
        if is_spanish:
            if any(k in msg for k in ["estim", "presupuest", "precio", "cotiz"]):
                reply = "¡Claro! Con gusto le programamos un presupuesto gratuito. ¿Cuáles son los detalles de su servicio?"
            else:
                reply = "Hola, recibimos su mensaje. En breve nos comunicaremos con usted. ¡Gracias!"
        elif is_chinese:
            if any(k in msg for k in ["估价", "价格", "报价"]):
                reply = "好的！我们提供免费估价。请问您需要什么服务？"
            else:
                reply = "您好，已收到您的信息。我们会尽快与您联系。谢谢！"
        elif is_french:
            if any(k in msg for k in ["devis", "prix", "estim"]):
                reply = "Bonjour ! Nous offrons des devis gratuits. Quels sont vos besoins ?"
            else:
                reply = "Bonjour, message reçu. Nous vous recontacterons sous peu. Merci !"
        else:
            if any(k in msg for k in ["estimate", "quote", "price"]):
                reply = "Sure thing! We offer free estimates. What are the details of the service you need?"
            else:
                reply = "Hi! Received your text. We will follow up with you shortly. Thank you!"
                
        return {"text": reply}
        
    try:
        from google.antigravity import Agent, LocalAgentConfig
        config = LocalAgentConfig(api_key=api_key, system_instructions=req.system_prompt)
        async with Agent(config) as agent:
            prompt = f"The customer texted us from phone '{req.customer_phone}' saying: '{req.message}'. Generate an immediate auto-textback reply."
            response = await agent.chat(prompt)
            return {"text": await response.text()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=True)
