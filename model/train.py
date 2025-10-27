import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib

try:
    df = pd.read_csv('email_spam.csv')
    # Ensure the required columns exist
    if not all(col in df.columns for col in ['text', 'label']):
        raise ValueError("CSV must contain 'text' and 'label' columns")
except FileNotFoundError:
    print("Error: email_spam.csv file not found")
    exit(1)
except Exception as e:
    print(f"Error loading CSV: {str(e)}")
    exit(1)

# --- THIS IS THE FIX ---
# Drop any rows where the 'text' column is blank (NaN)
print(f"Original data shape: {df.shape}")
df.dropna(subset=['text'], inplace=True)
print(f"Data shape after dropping NaNs: {df.shape}")
# ---------------------

# Split the data
X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], random_state=42)

# 2. Create an ML Pipeline
model_pipeline = Pipeline([
    ('vectorizer', TfidfVectorizer()),
    ('classifier', MultinomialNB())
])

# 3. Train the model
print("Training the model...")
model_pipeline.fit(X_train, y_train)
print("Model trained successfully.")

# You can optionally check its accuracy
accuracy = model_pipeline.score(X_test, y_test)
print(f"Model accuracy on test data: {accuracy:.4f}")

# 4. Save the trained pipeline
model_filename = 'email_classifier.joblib'
joblib.dump(model_pipeline, model_filename)
print(f"Model saved to {model_filename}")