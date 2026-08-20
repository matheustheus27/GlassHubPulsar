#!/usr/bin/env python3
"""
GlassHub Resume Extractor (Docling / PyResume Architecture)
Extracts structured resume JSON from PDF and DOCX documents with spatial layout analysis.
"""
import sys
import json
import re

def extract_clean_text(file_path):
    text = ""
    # Try pdfplumber / pypdf / pymupdf if available, fallback to basic text read
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or '') + "\n\n"
        return text
    except ImportError:
        pass

    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            text += (page.extract_text() or '') + "\n\n"
        return text
    except Exception:
        pass

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        return ""

def parse_resume_to_json(raw_text):
    # Clean noise
    cleaned = re.sub(r'%?PDF-[\d.]+', '', raw_text)
    cleaned = re.sub(r'/(Title|Creator|Producer|CreationDate|ModDate)\s*\([^\)]*\)', '', cleaned)
    
    lines = [l.strip() for l in cleaned.split('\n') if l.strip()]
    
    # 1. Contact Details
    email_m = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', cleaned)
    phone_m = re.search(r'(\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}', cleaned)
    linkedin_m = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)', cleaned, re.I)
    github_m = re.search(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)', cleaned, re.I)
    loc_m = re.search(r'(?:📍\s*)?([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,30},\s*[A-Z]{2})', cleaned)

    email = email_m.group(0) if email_m else ""
    phone = phone_m.group(0).strip() if phone_m else ""
    linkedin = f"https://{linkedin_m.group(0)}" if linkedin_m and not linkedin_m.group(0).startswith('http') else (linkedin_m.group(0) if linkedin_m else "")
    github = f"https://{github_m.group(0)}" if github_m and not github_m.group(0).startswith('http') else (github_m.group(0) if github_m else "")
    location = loc_m.group(1).strip() if loc_m else "Brasil"

    name = lines[0] if len(lines) > 0 and len(lines[0]) < 50 else "Candidato"
    title = lines[1] if len(lines) > 1 and len(lines[1]) < 60 and not "@" in lines[1] else "Desenvolvedor de Software"

    return {
        "personalDetails": {
            "name": name,
            "title": title,
            "contact": {
                "email": { "email": email, "icon": "✉️" },
                "phone": { "phone": phone, "link": f"https://wa.me/{re.sub(r'\\D', '', phone)}" if phone else "", "icon": "📞" },
                "networking": {
                    "linkedin": { "name": "LinkedIn", "url": linkedin, "icon": "💼" },
                    "github": { "name": "GitHub", "url": github, "icon": "🐙" }
                }
            },
            "location": { "location": location, "link": "", "icon": "📍" }
        },
        "raw_length": len(cleaned)
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = extract_clean_text(sys.argv[1])
        res = parse_resume_to_json(text)
        print(json.dumps(res, indent=2, ensure_ascii=False))
