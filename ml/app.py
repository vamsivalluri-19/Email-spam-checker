import os
import json
import joblib
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI Spam Detection ML Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and vectorizer
model = None
vectorizer = None
metrics = None

# Paths
MODEL_PATH = "model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
METRICS_PATH = "model_metrics.json"

def load_model_and_vectorizer():
    global model, vectorizer, metrics
    
    # Try to train if models don't exist
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        print("Model or Vectorizer not found. Triggering training...")
        try:
            from train import train_model
            train_model("spam_dataset.csv", ".")
        except Exception as e:
            print(f"Error training model on startup: {str(e)}")
            
    # Load model files
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            print("Model and Vectorizer loaded successfully!")
        except Exception as e:
            print(f"Error loading model files: {str(e)}")
            
    # Load metrics
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                metrics = json.load(f)
            print("Model metrics loaded successfully!")
        except Exception as e:
            print(f"Error loading metrics file: {str(e)}")

# Load files on startup
@app.on_event("startup")
def startup_event():
    load_model_and_vectorizer()

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    prediction: str
    probability: float
    keywords: list[str]

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    global model, vectorizer
    
    if model is None or vectorizer is None:
        # Try loading again
        load_model_and_vectorizer()
        if model is None or vectorizer is None:
            raise HTTPException(status_code=503, detail="ML Model is not loaded on this server.")
            
    try:
        text = request.text
        if not text.strip():
            raise HTTPException(status_code=400, detail="Text content cannot be empty.")
            
        # Transform using vectorizer
        vectorized_text = vectorizer.transform([text])
        
        # Run prediction
        prediction = model.predict(vectorized_text)[0]
        
        # Get probability
        # predict_proba returns probabilities for each class (ham, spam)
        # Classes are ordered alphabetically (['ham', 'spam'])
        probabilities = model.predict_proba(vectorized_text)[0]
        class_idx = list(model.classes_).index(prediction)
        probability = float(probabilities[class_idx])
        
        # Extract keywords contributing to classification (TF-IDF weights in this email)
        # Get feature names and their values for this email
        feature_names = vectorizer.get_feature_names_out()
        coo = vectorized_text.tocoo()
        
        # Get word-score pairs
        word_scores = []
        for col, score in zip(coo.col, coo.data):
            word_scores.append((feature_names[col], float(score)))
            
        # Sort by TF-IDF score descending
        word_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Get top 8 words
        keywords = [word for word, score in word_scores[:8]]
        
        return PredictResponse(
            prediction=str(prediction),
            probability=round(probability, 4),
            keywords=keywords
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train")
def train():
    global model, vectorizer, metrics
    
    try:
        from train import train_model
        new_metrics = train_model("spam_dataset.csv", ".")
        
        # Reload
        load_model_and_vectorizer()
        
        return {
            "success": True,
            "message": "Model retrained successfully!",
            "metrics": new_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.get("/status")
def status():
    global model, vectorizer, metrics
    
    return {
        "status": "ready" if model is not None else "model_not_loaded",
        "model_type": model.__class__.__name__ if model else "Unknown",
        "has_vectorizer": vectorizer is not None,
        "metrics": metrics
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
