import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib

# 1. Sample Data (In a real project, you'd load a large CSV)
# We'll create a simple dataset to get started.
data = {
    'text': [
        "Free entry in 2 a wkly comp to win FA Cup final tkts 21st May 2005.",  # spam
        "URGENT! You have won a 1 week FREE membership in our £100,000 Prize Jackpot!",  # spam
        "Hey, are you coming to the meeting tomorrow?",  # ham
        "I'm at the office. Please call me when you get a chance.",  # ham
        "Winner!! As a valued network customer you have been selected to receivea £900 prize reward!",  # spam
        "Hi mom, I'll be home late tonight.",  # ham
        "Can you pick up groceries on your way home?",  # ham
        "This is an important security notice for your account.",  # important (but we'll label as ham for this simple model)
        "Don't forget to submit your project report by Friday.", # ham
        "Click here to claim your free iPhone 15." # spam
    ],
    'label': [
        'spam',
        'spam',
        'ham',
        'ham',
        'spam',
        'ham',
        'ham',
        'ham', # Labeled 'ham' for simplicity. Your 'important' label would go here.
        'ham',
        'spam'
    ]
}

df = pd.DataFrame(data)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], random_state=42)

# 2. Create an ML Pipeline
# A pipeline makes our model clean and easy to deploy.
# It chains together the steps:
#   a) TfidfVectorizer: Converts raw text into numerical features (TF-IDF).
#   b) MultinomialNB: A classic, fast, and effective model for text classification (Naive Bayes).

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