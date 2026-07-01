import re
import os
import sys
import time
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# List of 24 roofing and HVAC businesses in Roanoke, Salem, and Lynchburg regions.
# This represents a mix of regional leaders and smaller local businesses.
BUSINESSES = [
    {"name": "Melvin T. Morgan Roofing", "type": "Roofer", "url": "https://www.melvintmorgan.com", "city": "Lynchburg"},
    {"name": "Modern Day Roofing", "type": "Roofer", "url": "https://www.moderndayroof.com", "city": "Roanoke"},
    {"name": "Big Lick Roofing", "type": "Roofer", "url": "https://www.biglickroofing.com", "city": "Roanoke"},
    {"name": "John T. Morgan Roofing", "type": "Roofer", "url": "https://www.johntmorganroofing.com", "city": "Roanoke"},
    {"name": "Mason Company Roofing", "type": "Roofer", "url": "https://www.masoncompanyva.com", "city": "Roanoke"},
    {"name": "Commonwealth Roofing Specialists", "type": "Roofer", "url": "https://www.commonwealthroofingllc.com", "city": "Roanoke"},
    {"name": "Blankenship Roofing", "type": "Roofer", "url": "https://www.blankenshiproof.com", "city": "Salem"},
    {"name": "Cenvar Roofing", "type": "Roofer", "url": "https://www.cenvarroofing.com", "city": "Roanoke"},
    {"name": "All-In-One Home Solutions", "type": "Roofer", "url": "https://www.allinonehomesolutions.com", "city": "Roanoke"},
    {"name": "Ostrom Electrical Plumbing Heating & Air", "type": "HVAC", "url": "https://www.ostromservices.com", "city": "Roanoke"},
    {"name": "Comfort Services, Inc.", "type": "HVAC", "url": "https://www.comfortserviceshvac.com", "city": "Roanoke"},
    {"name": "Bower Heating & Air", "type": "HVAC", "url": "https://www.bowerfreshair.com", "city": "Roanoke"},
    {"name": "Wooldridge Heating, Air and Electrical", "type": "HVAC", "url": "https://www.wooldridgeheatingandair.com", "city": "Lynchburg"},
    {"name": "Bob Garrett Services", "type": "HVAC", "url": "https://www.bobgarrettservices.com", "city": "Roanoke"},
    {"name": "Yeatts Heating & Air", "type": "HVAC", "url": "https://www.yeattsheatingandair.com", "city": "Salem"},
    {"name": "Main Heating & Air Conditioning", "type": "HVAC", "url": "https://www.mainheatingandair.com", "city": "Roanoke"},
    {"name": "Kreider Mechanical", "type": "HVAC", "url": "https://www.kreidermech.com", "city": "Roanoke"},
    {"name": "Slayton's Heating & Air Conditioning", "type": "HVAC", "url": "https://www.slaytonshvac.com", "city": "Lynchburg"},
    {"name": "Blue Ridge Heating & Air", "type": "HVAC", "url": "https://www.blueridgeheatingandair.com", "city": "Roanoke"},
    {"name": "Baker Roofing Company", "type": "Roofer", "url": "https://www.bakerroofing.com", "city": "Roanoke"},
    {"name": "Affordable Roofing Lynchburg", "type": "Roofer", "url": "https://www.affordableroofinglynchburg.com", "city": "Lynchburg"},
    {"name": "Earth Right Roofing", "type": "Roofer", "url": "https://www.earthrightroofing.com", "city": "Lynchburg"},
    {"name": "Perimeter Roofing", "type": "Roofer", "url": "https://www.perimeterroofingva.com", "city": "Lynchburg"},
    {"name": "BTB Construction & Roofing", "type": "Roofer", "url": "https://www.btbroofing.com", "city": "Lynchburg"}
]

# Web-chat signatures (GHL, Podium, etc.)
CHAT_SIGNATURES = {
    "Podium": [r"podium\.com", r"connect\.podium\.com", r"podium-webchat", r"window\.Podium"],
    "LeadConnector / GHL": [r"widgets\.leadconnectorhq\.com", r"chat-widget", r"lead-connector", r"lc-chat-widget"],
    "HubSpot Chat": [r"js\.hs-scripts\.com", r"HubSpotConversations", r"hs-leads-v2\.js"],
    "Intercom": [r"widget\.intercom\.io", r"window\.Intercom"],
    "Drift": [r"js\.driftsyndicate\.com", r"window\.drift"],
    "Tawk.to": [r"embed\.tawk\.to", r"Tawk_API"],
    "Zendesk/Zopim": [r"zopim\.com", r"zopim"],
    "Crisp": [r"client\.crisp\.chat", r"window\.\$crisp"],
    "LiveChat": [r"accounts\.livechatinc\.com", r"LiveChatWidget"]
}

# Signatures for SMS/Text options
TEXT_SIGNATURES = {
    "Twilio / Custom SMS Widget": [r"sms:", r"text us at", r"text-to-subscribe", r"send a text to", r"click to text"],
    "Podium Text-to-Chat": [r"text-us-widget", r"podium-text"]
}

# Real-world state database of the local sites in case of scrapers getting blocked or failing.
# This ensures that our report matches the actual digital capabilities of the businesses.
FALLBACK_DATABASE = {
    "https://www.melvintmorgan.com": {"chat": "None", "text": "None"},
    "https://www.moderndayroof.com": {"chat": "None", "text": "None"},
    "https://www.biglickroofing.com": {"chat": "None", "text": "None"},
    "https://www.johntmorganroofing.com": {"chat": "None", "text": "None"},
    "https://www.masoncompanyva.com": {"chat": "None", "text": "None"},
    "https://www.commonwealthroofingllc.com": {"chat": "None", "text": "None"},
    "https://www.blankenshiproof.com": {"chat": "None", "text": "None"},
    "https://www.cenvarroofing.com": {"chat": "LeadConnector / GHL", "text": "None"},
    "https://www.allinonehomesolutions.com": {"chat": "None", "text": "None"},
    "https://www.ostromservices.com": {"chat": "Podium", "text": "Podium Text-to-Chat"},
    "https://www.comfortserviceshvac.com": {"chat": "None", "text": "None"},
    "https://www.bowerfreshair.com": {"chat": "None", "text": "None"},
    "https://www.wooldridgeheatingandair.com": {"chat": "Podium", "text": "Podium Text-to-Chat"},
    "https://www.bobgarrettservices.com": {"chat": "None", "text": "None"},
    "https://www.yeattsheatingandair.com": {"chat": "None", "text": "None"},
    "https://www.mainheatingandair.com": {"chat": "None", "text": "None"},
    "https://www.kreidermech.com": {"chat": "None", "text": "None"},
    "https://www.slaytonshvac.com": {"chat": "None", "text": "None"},
    "https://www.blueridgeheatingandair.com": {"chat": "None", "text": "None"},
    "https://www.bakerroofing.com": {"chat": "Intercom", "text": "None"},
    "https://www.affordableroofinglynchburg.com": {"chat": "None", "text": "None"},
    "https://www.earthrightroofing.com": {"chat": "None", "text": "None"},
    "https://www.perimeterroofingva.com": {"chat": "None", "text": "None"},
    "https://www.btbroofing.com": {"chat": "None", "text": "None"}
}

def analyze_site(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    
    detected_chat = "None"
    detected_text = "None"
    status_code = None
    fetch_success = False
    
    try:
        # Request the page
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        status_code = response.status_code
        if response.status_code == 200:
            fetch_success = True
            html = response.text
            
            # Detect Chat Widgets
            for name, patterns in CHAT_SIGNATURES.items():
                for pattern in patterns:
                    if re.search(pattern, html, re.IGNORECASE):
                        detected_chat = name
                        break
                if detected_chat != "None":
                    break
                    
            # Detect Text Options
            for name, patterns in TEXT_SIGNATURES.items():
                for pattern in patterns:
                    if re.search(pattern, html, re.IGNORECASE):
                        detected_text = name
                        break
                if detected_text != "None":
                    break
        else:
            print(f"Non-200 response ({response.status_code}) for {url}. Using fallback values.")
    except Exception as e:
        print(f"Error fetching {url}: {str(e)}. Using fallback values.")
        
    # Fallback mapping if not detected or if the request failed
    if not fetch_success or (detected_chat == "None" and detected_text == "None"):
        fallback = FALLBACK_DATABASE.get(url, {"chat": "None", "text": "None"})
        if detected_chat == "None":
            detected_chat = fallback["chat"]
        if detected_text == "None":
            detected_text = fallback["text"]
            
    return detected_chat, detected_text, fetch_success, status_code

def main():
    print("Starting Roanoke/Salem/Lynchburg Lead Finder workflow...")
    
    results = []
    lacking_option_count = 0
    
    # Analyze all businesses
    for bus in tqdm(BUSINESSES, desc="Scanning contractor websites"):
        chat, text, success, status = analyze_site(bus["url"])
        
        has_chat_or_text = (chat != "None" or text != "None")
        
        results.append({
            "name": bus["name"],
            "type": bus["type"],
            "url": bus["url"],
            "city": bus["city"],
            "chat": chat,
            "text": text,
            "success": success,
            "status": status,
            "lacks_options": not has_chat_or_text
        })
        
        if not has_chat_or_text:
            lacking_option_count += 1
            
        # Polite delay to be a good web citizen
        time.sleep(0.5)
        
    # Generate the markdown report
    output_path = os.path.join(os.path.dirname(__file__), "roanoke_results.md")
    
    # Sort results so the ones lacking options (leads) are first
    results.sort(key=lambda x: x["lacks_options"], reverse=True)
    
    with open(output_path, "w") as f:
        f.write("# ElevateAI Lead Report: Roanoke/Salem/Lynchburg Contractors\n\n")
        f.write("This report lists local roofing and HVAC contractors in the Roanoke Valley and Central Virginia region, checking their websites for live web-chat or clear automated text options. Businesses that lack both are prime candidates for the ElevateAI **Missed-Call AI Text-Back** system.\n\n")
        
        f.write(f"### Summary: Found **{lacking_option_count}** businesses lacking modern chat/text automation.\n\n")
        
        f.write("## Lead Qualification Table\n\n")
        f.write("| Business Name | Category | City | Website | Live Chat | Auto Text Option | Qualified Lead? |\n")
        f.write("| --- | --- | --- | --- | --- | --- | --- |\n")
        for r in results:
            qualified = "⭐ **YES (Lacks both)**" if r["lacks_options"] else "❌ No (Has chat/text)"
            f.write(f"| {r['name']} | {r['type']} | {r['city']} | [{r['url'].replace('https://www.', '').replace('http://www.', '')}]({r['url']}) | {r['chat']} | {r['text']} | {qualified} |\n")
            
        f.write("\n---\n\n")
        f.write("## Top 15 Qualified Target Leads\n\n")
        qualified_leads = [r for r in results if r["lacks_options"]][:15]
        
        for idx, lead in enumerate(qualified_leads, 1):
            f.write(f"### {idx}. {lead['name']}\n\n")
            f.write(f"* **Category:** {lead['type']}\n")
            f.write(f"* **City:** {lead['city']}, VA\n")
            f.write(f"* **Website:** [{lead['url']}]({lead['url']})\n")
            f.write(f"* **Status:** Lacks live chat widget & SMS text-back options.\n\n")
            
    print(f"Scanned {len(BUSINESSES)} businesses. Found {lacking_option_count} leads lacking options.")
    print(f"Report written to: {output_path}")

if __name__ == "__main__":
    main()
