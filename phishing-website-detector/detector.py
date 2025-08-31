import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Sample dataset URL: https://datahub.io/machine-learning/urldata
# For demonstration, we will create a small sample dataset inline

data = {
    'url': [
        'http://example.com',
        'https://secure-login.com',
        'http://phishing-site.com/login',
        'https://bankofamerica.com.secure-login.com',
        'http://paypal.com',
        'http://malicious-site.ru',
        'https://accounts.google.com',
        'http://free-gift-cards.com',
        'https://secure.paypal.com',
        'http://update-account-info.com'
    ],
    'label': [0, 0, 1, 1, 0, 1, 0, 1, 0, 1]  # 0 = legitimate, 1 = phishing
}

df = pd.DataFrame(data)

# Feature extraction using TF-IDF on URLs
vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3,5))
X = vectorizer.fit_transform(df['url'])
y = df['label']

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Train classifier
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluate
y_pred = clf.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save model and vectorizer
joblib.dump(clf, 'phishing_detector_model.joblib')
joblib.dump(vectorizer, 'vectorizer.joblib')

def predict_url(url):
    model = joblib.load('phishing_detector_model.joblib')
    vect = joblib.load('vectorizer.joblib')
    X = vect.transform([url])
    pred = model.predict(X)
    return 'Phishing' if pred[0] == 1 else 'Legitimate'

if __name__ == "__main__":
    test_urls = [
        'http://secure-login.com',
        'http://fake-bank.com/login',
        'https://paypal.com',
        'http://free-money.ru'
    ]
    for url in test_urls:
        print(f"URL: {url} -> Prediction: {predict_url(url)}")
