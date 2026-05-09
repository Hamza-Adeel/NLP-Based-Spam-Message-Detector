import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
import os
from preprocess import preprocess_text

def train_and_save_model():
    print("Loading data...")
    # Ensure the CSV file exists
    csv_path = 'spam.csv'
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset {csv_path} not found.")
        
    # Load dataset
    df = pd.read_csv(csv_path, encoding='latin-1')
    
    # Drop unnecessary columns commonly found in this dataset
    cols_to_drop = [col for col in df.columns if col.startswith('Unnamed')]
    if cols_to_drop:
        df = df.drop(cols_to_drop, axis=1)
    
    # Rename columns to standard names
    df.rename(columns={'v1': 'target', 'v2': 'text'}, inplace=True)
    
    # Encode target variable: ham -> 0, spam -> 1
    df['target'] = df['target'].map({'ham': 0, 'spam': 1})
    
    print("Preprocessing text... This may take a minute.")
    # Apply preprocessing using our custom function
    df['transformed_text'] = df['text'].apply(preprocess_text)
    
    print("Training model...")
    # Feature extraction using TF-IDF
    tfidf = TfidfVectorizer(max_features=3000)
    X = tfidf.fit_transform(df['transformed_text']).toarray()
    y = df['target'].values
    
    # Train Multinomial Naive Bayes model
    mnb = MultinomialNB()
    mnb.fit(X, y)
    
    print("Saving model and vectorizer...")
    # Save the trained model and vectorizer for later use in the Flask app
    joblib.dump(tfidf, 'vectorizer.pkl')
    joblib.dump(mnb, 'model.pkl')
    print("Model training complete.")

if __name__ == "__main__":
    train_and_save_model()
