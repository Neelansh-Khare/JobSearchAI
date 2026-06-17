"""
Shared Ollama client — replaces Google Gemini for all AI calls.
Configure via env vars: OLLAMA_MODEL, OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL.
"""
import os
import ollama as _ollama

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

_client = _ollama.Client(host=OLLAMA_BASE_URL)


def generate_text(prompt: str, system_prompt: str = "", temperature: float = 0.2, json_mode: bool = False) -> str:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    kwargs = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "options": {"temperature": temperature},
    }
    if json_mode:
        kwargs["format"] = "json"

    response = _client.chat(**kwargs)
    return response.message.content


def embed_text(text: str) -> list:
    response = _client.embed(model=OLLAMA_EMBED_MODEL, input=text)
    return response.embeddings[0]
