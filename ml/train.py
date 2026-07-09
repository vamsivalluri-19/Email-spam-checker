import pandas as pd
import numpy as np
import joblib
import os
import datetime
import json
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

def train_model(dataset_path="spam_dataset.csv", model_dir="."):
    print("Starting ML Model training...")
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
        
    # 1. Load Dataset
    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df)} records from dataset.")
    
    # Fill any empty values
    df['text'] = df['text'].fillna('')
    
    X = df['text']
    y = df['label'] # 'spam' or 'ham'
    
    # 2. Split data (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 3. Vectorization (TF-IDF)
    vectorizer = TfidfVectorizer(
        stop_words='english',
        lowercase=True,
        sublinear_tf=True,
        ngram_range=(1, 2)
    )
    
    print("Vectorizing text data...")
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # 4. Train Model 1: Naive Bayes
    print("Training Model 1: Multinomial Naive Bayes...")
    nb_model = MultinomialNB(alpha=0.1)
    nb_model.fit(X_train_vec, y_train)
    
    nb_preds = nb_model.predict(X_test_vec)
    nb_accuracy = accuracy_score(y_test, nb_preds)
    
    # Train Model 2: Logistic Regression
    print("Training Model 2: Logistic Regression...")
    lr_model = LogisticRegression(C=5.0, max_iter=1000, solver='liblinear')
    lr_model.fit(X_train_vec, y_train)
    
    lr_preds = lr_model.predict(X_test_vec)
    lr_accuracy = accuracy_score(y_test, lr_preds)
    
    print(f"\nModel evaluation results:")
    print(f"- Naive Bayes Accuracy: {nb_accuracy:.4f}")
    print(f"- Logistic Regression Accuracy: {lr_accuracy:.4f}")
    
    # Choose the best model based on accuracy
    if lr_accuracy >= nb_accuracy:
        print("\nSelecting Logistic Regression as the best model.")
        best_model = lr_model
        best_accuracy = lr_accuracy
        best_preds = lr_preds
        model_name = "Logistic Regression"
    else:
        print("\nSelecting Multinomial Naive Bayes as the best model.")
        best_model = nb_model
        best_accuracy = nb_accuracy
        best_preds = nb_preds
        model_name = "Multinomial Naive Bayes"
        
    # Get precision, recall, f1 for chosen model
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, best_preds, average=None, labels=['ham', 'spam']
    )
    
    print("\n--- Selected Model Results ---")
    print(f"Selected: {model_name}")
    print(f"Accuracy: {best_accuracy:.4f}")
    print(f"Ham class -> Precision: {precision[0]:.4f}, Recall: {recall[0]:.4f}, F1: {f1[0]:.4f}")
    print(f"Spam class -> Precision: {precision[1]:.4f}, Recall: {recall[1]:.4f}, F1: {f1[1]:.4f}")
    print("------------------------------\n")
    
    # 5. Save model, vectorizer, and metrics
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, "model.pkl")
    vec_path = os.path.join(model_dir, "vectorizer.pkl")
    metrics_path = os.path.join(model_dir, "model_metrics.json")
    
    joblib.dump(best_model, model_path)
    joblib.dump(vectorizer, vec_path)
    
    metrics = {
        "accuracy": round(float(best_accuracy), 4),
        "spam_precision": round(float(precision[1]), 4),
        "spam_recall": round(float(recall[1]), 4),
        "spam_f1": round(float(f1[1]), 4),
        "ham_precision": round(float(precision[0]), 4),
        "ham_recall": round(float(recall[0]), 4),
        "ham_f1": round(float(f1[0]), 4),
        "dataset_size": int(len(df)),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "model_type": model_name,
        "trained_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)
        
    print(f"Model saved to {model_path}")
    print(f"Vectorizer saved to {vec_path}")
    print(f"Metrics saved to {metrics_path}")
    
    return metrics

if __name__ == "__main__":
    train_model("spam_dataset.csv", ".")
