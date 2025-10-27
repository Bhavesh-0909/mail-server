from flask import Flask, request, jsonify
import joblib

# Create a Flask application instance
app = Flask(__name__)

# --- Load the Model ---
# We load the model *outside* the request handling functions.
# This way, it's loaded only ONCE when the server starts,
# not every time a request comes in.
print("Loading the model...")
try:
    model = joblib.load('email_classifier.joblib')
    print("Model loaded successfully.")
except FileNotFoundError:
    print("Error: Model file 'email_classifier.joblib' not found.")
    print("Please run train.py first to create the model.")
    model = None
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# --- Define the API Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    # 1. Check if the model was loaded successfully
    if model is None:
        return jsonify({'error': 'Model is not loaded. Check server logs.'}), 500

    # 2. Get JSON data from the request
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({'error': f'Invalid JSON format: {e}'}), 400

    # 3. Validate the input
    if 'email_text' not in data:
        return jsonify({'error': 'Missing "email_text" key in JSON payload.'}), 400
    
    if not isinstance(data['email_text'], str):
         return jsonify({'error': '"email_text" must be a string.'}), 400

    # 4. Make a prediction
    try:
        # The model's pipeline expects a list or array of text samples
        email_text = [data['email_text']]
        
        # .predict() returns an array (e.g., ['ham'])
        prediction = model.predict(email_text)
        
        # .predict_proba() can give you confidence scores (optional)
        probabilities = model.predict_proba(email_text)
        classes = model.classes_
        
        # Create a nice dictionary of probabilities
        confidence_scores = dict(zip(classes, probabilities[0]))

        # 5. Return the response
        response = {
            'predicted_label': prediction[0],
            'confidence_scores': confidence_scores
        }
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': f'Error during prediction: {e}'}), 500

# --- Run the App ---
if __name__ == '__main__':
    # 'debug=True' reloads the server on code changes
    # 'host=0.0.0.0' makes it accessible on your network
    app.run(host='0.0.0.0', port=5000, debug=True)