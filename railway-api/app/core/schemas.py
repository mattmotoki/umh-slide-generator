"""
Domain models and Pydantic schemas
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


# Scripture schemas
class ScriptureSlideRequest(BaseModel):
    reference: Dict[str, Any]  # {"book": "PS", "chapter": 23}
    verses: List[Dict[str, Any]]  # [{"verse": 1, "text": "..."}]
    verses_alt: Optional[List[Dict[str, Any]]] = None  # Optional alternate translation
    background_image: Optional[str] = None  # Base64 encoded image


# Hymn schemas
class HymnRequest(BaseModel):
    title: str
    number: str
    hymnal: str = "UMH"
    lyrics: Optional[List[Dict[str, str]]] = None
    author: Optional[str] = None
    composer: Optional[str] = None
    tune_name: Optional[str] = None
    text_copyright: Optional[str] = None
    tune_copyright: Optional[str] = None
    background_image: Optional[str] = None


# Call to Worship schemas
class CallToWorshipRequest(BaseModel):
    pairs: Optional[List[Dict[str, str]]] = None
    text: Optional[str] = None
    background_image: Optional[str] = None


# Bulletin schemas
class BulletinRequest(BaseModel):
    content: str
    title: Optional[str] = "Sunday Worship Service"
    show_hymn_titles: bool = True
    use_tongan_verses: bool = False
    format: str = "docx"  # docx, pdf, html


# Parser schemas
class ParseRequest(BaseModel):
    content: str
    extract_scripture: bool = True
    extract_hymns: bool = True
    extract_liturgy: bool = True


class ParsedElement(BaseModel):
    type: str  # "scripture", "hymn", "liturgy", "heading", "text"
    content: Any  # Varies by type
    metadata: Optional[Dict[str, Any]] = None


class ParseResponse(BaseModel):
    elements: List[ParsedElement]
    hymns: List[Dict[str, Any]]
    scriptures: List[Dict[str, Any]]
    liturgies: List[Dict[str, Any]]


# Welcome slide schema
class WelcomeSlideRequest(BaseModel):
    lead_pastor: str = "Pastor"
    background_image: Optional[str] = None  # Base64 encoded image


# Message for All Generations slide schema
class MessageForAllGenerationsRequest(BaseModel):
    lead_pastor: str = "Pastor"
    background_image: Optional[str] = None  # Base64 encoded image


# Benediction slide schema
class BenedictionRequest(BaseModel):
    lead_pastor: str = "Pastor"
    background_image: Optional[str] = None  # Base64 encoded image


# Prayer of Dedication slide schema
class PrayerOfDedicationRequest(BaseModel):
    lead_pastor: str = "Pastor"
    background_image: Optional[str] = None  # Base64 encoded image


# Gloria Patri slide schema
class GloriaPatriRequest(BaseModel):
    background_image: Optional[str] = None  # Base64 encoded image