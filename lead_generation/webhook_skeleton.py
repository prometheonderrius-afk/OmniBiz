"""
ElevateAI: Missed-Call AI Text-Back Webhook Server Skeleton
Technology Stack: Python, FastAPI, Twilio API, Local LLM (Ollama)

This file implements:
1. /webhook/twilio/missed-call: Receives Twilio's status callback. If the call was missed,
   triggers the initial greeting text back.
2. /webhook/twilio/sms-reply: Receives incoming replies from the customer, feeds them
   to the local LLM with the receptionist system prompt, and returns the response as TwiML.
"""

import os
from typing import Optional
from fastapi import FastAPI, Form, Response, HTTPException
from pydantic import BaseModel
import requests

app = FastAPI(
    title="ElevateAI Missed-Call AI Text-Back Backend",
    description="Twilio webhook skeleton integrating local LLM conversational receptionalist.",
    version="1.0.0"
)

# Configuration (In production, load these from environment variables or a dotenv file)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "your_auth_token_here")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+15405550199")  # Business SMS number

LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/api/generate")  # Default Ollama URL
LOCAL_LLM_MODEL = os.getenv("LOCAL_LLM_MODEL", "llama3")  # Local model choice

PROMPT_FILE_PATH = os.path.join(os.path.dirname(__file__), "receptionist_prompt.md")

# Simple in-memory session store to track chat history for demo purposes
# (In production, use Redis or a database keyed by the customer's phone number)
CONVERSATION_HISTORY = {}


def load_receptionist_prompt() -> str:
    """Helper function to load the system prompt from the markdown file."""
    try:
        with open(PROMPT_FILE_PATH, "r") as f:
            content = f.read()
            # Extract only the text block under the ```text marker if possible
            if "```text" in content:
                prompt = content.split("```text")[1].split("```")[0].strip()
                return prompt
            return content.strip()
    except Exception as e:
        print(f"Error loading system prompt: {e}")
        # Secure fallback prompt
        return "You are Sarah, the friendly virtual receptionist for Apex Contracting. Ask how you can help."


def send_initial_sms(to_number: str, business_name: str = "Apex Contracting"):
    """
    Sends the initial text-back SMS to the customer using the Twilio API.
    """
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    
    # Standard missed-call greeting hook
    body_text = f"Hi there! Sorry we missed your call. This is Sarah with {business_name}. Are you looking for help with your heating/cooling system or a roofing project?"
    
    payload = {
        "From": TWILIO_PHONE_NUMBER,
        "To": to_number,
        "Body": body_text
    }
    
    # Save the initial outreach to conversation history
    CONVERSATION_HISTORY[to_number] = [
        {"role": "assistant", "content": body_text}
    ]
    
    try:
        response = requests.post(
            url,
            data=payload,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        )
        if response.status_code == 201:
            print(f"Successfully sent initial text-back to {to_number}")
        else:
            print(f"Failed to send Twilio SMS. Code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        print(f"Failed to connect to Twilio: {e}")


def query_local_llm(customer_phone: str, new_message: str) -> str:
    """
    Constructs the conversational history, queries the local Ollama LLM, 
    and returns the model response.
    """
    system_prompt = load_receptionist_prompt()
    
    # Retrieve existing chat history or create a new session
    history = CONVERSATION_HISTORY.get(customer_phone, [])
    history.append({"role": "user", "content": new_message})
    
    # Format the prompt for Ollama's generate API with clear system/context tokens
    formatted_prompt = f"{system_prompt}\n\n"
    for turn in history:
        role = "Customer" if turn["role"] == "user" else "Sarah"
        formatted_prompt += f"{role}: {turn['content']}\n"
    formatted_prompt += "Sarah:"
    
    try:
        response = requests.post(
            LOCAL_LLM_URL,
            json={
                "model": LOCAL_LLM_MODEL,
                "prompt": formatted_prompt,
                "stream": False
            },
            timeout=15
        )
        if response.status_code == 200:
            ai_reply = response.json().get("response", "").strip()
            # Strip any accidental 'Sarah:' prefixes the model might return
            if ai_reply.startswith("Sarah:"):
                ai_reply = ai_reply.replace("Sarah:", "").strip()
                
            # Append AI response to memory
            history.append({"role": "assistant", "content": ai_reply})
            CONVERSATION_HISTORY[customer_phone] = history
            return ai_reply
        else:
            print(f"LLM Server returned code {response.status_code}. Using fallback.")
    except Exception as e:
        print(f"Error calling local LLM: {e}")
        
    return "I'm having trouble connecting to my system. I'll make sure one of our team members calls you directly! What is the best name for us to ask for?"


@app.post("/webhook/twilio/missed-call")
async def twilio_missed_call(
    From: str = Form(...),
    To: str = Form(...),
    CallStatus: str = Form(...),
    CallSid: str = Form(...)
):
    """
    Webhook target for Twilio Call Status Callbacks.
    Configure this URL under your Twilio Number's Call Status Callback option,
    and select 'no-answer', 'busy', 'failed' as status events.
    """
    print(f"Received Call Event - SID: {CallSid}, From: {From}, Status: {CallStatus}")
    
    # Verify if the call was indeed missed (no-answer, busy, failed, or completed with zero duration)
    missed_statuses = ["no-answer", "busy", "failed"]
    
    if CallStatus in missed_statuses:
        print(f"Missed call detected from {From}. Triggering Text-Back sequence...")
        send_initial_sms(to_number=From)
        return {"status": "triggered_text_back", "recipient": From}
        
    return {"status": "ignored_status", "status_received": CallStatus}


@app.post("/webhook/twilio/sms-reply")
async def twilio_sms_reply(
    From: str = Form(...),
    Body: str = Form(...)
):
    """
    Webhook target for Twilio SMS Webhook.
    Configure this URL under 'A Message Comes In' on your Twilio phone number.
    Returns standard TwiML XML to instruct Twilio to text the reply back.
    """
    print(f"Received SMS from {From}: {Body}")
    
    # Query our local LLM with the context & new response
    ai_response_text = query_local_llm(customer_phone=From, new_message=Body)
    
    # Build standard TwiML XML response
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{ai_response_text}</Message>
</Response>"""

    return Response(content=twiml_response, media_type="application/xml")


if __name__ == "__main__":
    import uvicorn
    print("Starting Missed-Call AI Text-Back backend on port 8000...")
    print("Loaded Receptionist system prompt template successfully.")
    uvicorn.run(app, host="0.0.0.0", port=8000)
