# Lead-Generation and Personalization Workflow

This tool gathers a target list of 30 service-based businesses in Virginia (plumbers, landscapers, roofers), analyzes their website structure to check if they use web-chat widgets or CRM integrations, and generates personalized outreach emails proposing integrations via ElevateAI.

## Requirements

* Python 3.10+
* Dependencies:
  * `requests`
  * `beautifulsoup4`
  * `tqdm`

## Setup

1. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Script

Execute the main script:
```bash
python gather_and_analyze.py
```

This will run the analyzer and write the results to `results.md` and print a summary.
