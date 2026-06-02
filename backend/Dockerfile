# Use an official Python slim image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies, including LaTeX for resume compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    # LaTeX compilation packages (lightweight subset of TeX Live) \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    # Clean up \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install Python packages
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source code
COPY . /app/

# Expose the port FastAPI will run on
EXPOSE 8000

# Run FastAPI using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
