# SentiSpam AI - Advanced Email Spam & Phishing Classifier

SentiSpam AI is a premium, end-to-end web application that detects email spam, phishing attacks, invoices scams, and fraudulent messages in real-time. The system uses a machine learning pipeline powered by **Logistic Regression** and **TF-IDF vectorization** implemented in Python (FastAPI), alongside a robust Node.js (Express) backend dashboard and MongoDB storage.

---

## Key Features

- ✉️ **Real-time Spam Checker**: Paste any email subject and body to instantly analyze its spam probability with a visual gauge indicator.
- 📂 **Bulk File Processing**: Upload email collections in `.csv` or `.txt` format to batch-predict spam status, displaying metrics in tabular format with options to export results.
- 📜 **Scan History**: Keep a comprehensive log of all scans with filtering by classification type (spam/ham), date range, and text search.
- 🔒 **User Authentication**: Secure user login, signup, and profile editing, complete with password modification.
- 🛡️ **Admin Intelligence Dashboard**:
  - Track total system users, scans, spam flags, and spam rates.
  - View user accounts, change user permissions (promote to Admin), or delete users.
  - Inspect model performance details (accuracy, precision, recall, dataset size).
  - Trigger model retraining directly from the UI with a single click.
- ⚙️ **Fallback Mode**: Includes a regex-based keyword fallback system to protect the user interface and APIs from crashing if the Python ML server is temporarily offline.

---

## Project Architecture

```
                    ┌────────────────────────┐
                    │  HTML5 / CSS3 / JS     │
                    │   Premium Dashboard    │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Node.js & Express    │  (Port 5000)
                    │  Backend API Server    │
                    └─────┬──────────────┬───┘
                          │              │
        (Save logs & user)│              │(Proxy predictions)
                          ▼              ▼
           ┌──────────────────┐    ┌──────────────────┐
           │     MongoDB      │    │  FastAPI (Python)│  (Port 8000)
           │  Cloud Database  │    │  ML serving app  │
           └──────────────────┘    └──────────────────┘
```

---

## Directory Structure

```
.
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── adminController.js    # Admin stats & user management
│   ├── authController.js     # User signup, sign-in & logout
│   ├── spamController.js     # Predictive text/file pipelines
│   └── userController.js     # Dashboard user statistics
├── middleware/
│   ├── adminMiddleware.js    # Admin access check
│   ├── authMiddleware.js     # JWT validation check
│   ├── errorMiddleware.js    # Express global error handler
│   └── uploadMiddleware.js   # Multer file upload setup
├── models/
│   ├── User.js               # User MongoDB Schema
│   └── SpamHistory.js        # Spam Check Log Schema
├── routes/
│   ├── adminRoutes.js        # Admin paths
│   ├── authRoutes.js         # Auth paths
│   ├── spamRoutes.js         # Prediction paths
│   └── userRoutes.js         # User stats paths
├── utils/
│   └── generateToken.js      # JWT token signer
├── ml/
│   ├── app.py                # FastAPI server (port 8000)
│   ├── dataset.py            # Expanded spam/ham dataset generator
│   ├── train.py              # TF-IDF + Logistic Regression training
│   ├── requirements.txt      # Python dependencies
│   ├── model.pkl             # Serialized optimal model
│   ├── vectorizer.pkl        # Serialized TF-IDF vectorizer
│   └── model_metrics.json    # Train evaluation metrics
├── public/
│   ├── index.html            # SPA layout
│   ├── styles.css            # Dark mode glassmorphism styles
│   └── app.js                # Frontend AJAX & DOM client script
├── uploads/                  # Temporary file upload directory
├── server.js                 # Root Express server (port 5000)
├── .env                      # Environment config variables
├── package.json              # Node dependencies configuration
└── README.md                 # Project documentation
```

---

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+
- MongoDB database URI

### 1. Environment Configurations
Create a `.env` file in the root directory (already populated) with the following structure:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
ML_SERVER=http://localhost:8000
```

### 2. Node.js Backend Setup
Open a terminal in the root directory and install dependencies:
```bash
npm install
```

### 3. Python ML Service Setup
Navigate to the `ml/` directory and install Python dependencies:
```bash
cd ml
pip install -r requirements.txt
```

---

## How to Run locally

You need to run **both** servers to get the complete functionality.

### Start the Python ML Service
From the `ml/` directory:
```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```
*Note: If the models (`model.pkl` and `vectorizer.pkl`) are missing, the FastAPI server will automatically trigger `train.py` to generate the dataset and train the model on startup.*

### Start the Node.js Backend Server
From the root directory:
```bash
npm run dev
```

The application will be accessible at:
- **Web Frontend**: [http://localhost:5000](http://localhost:5000)
- **ML API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Machine Learning Details

The classifier is built using Python's `scikit-learn` library.
1. **Dataset**: A generated balanced corpus of 3,200 emails comprising typical ham (work syncs, schedule syncs, personal notes, transactional receipts) and typical spam (lottery announcements, fake Geek Squad support invoice templates, USDT airdrops, security warnings, pharmacy discounts).
2. **Features**: Text is vectorized using `TfidfVectorizer` (unigrams and bigrams, sublinear TF scaling).
3. **Model**: A **Logistic Regression** model is fitted, outperforming Multinomial Naive Bayes on validation sets, and serialized to disk for instant inference.
