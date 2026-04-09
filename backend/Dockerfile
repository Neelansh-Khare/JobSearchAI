# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install system dependencies for LaTeX and Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-extra \
    latexmk \
    curl \
    gnupg \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and its system dependencies
RUN pip install playwright && \
    playwright install-deps chromium && \
    playwright install chromium

# Copy the rest of the application
COPY . .

# Create output directories
RUN mkdir -p output/pdfs output/latex

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
