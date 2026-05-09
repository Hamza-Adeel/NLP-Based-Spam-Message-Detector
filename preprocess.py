import string
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
import os

# Ensure NLTK data directories exist and download required packages
nltk_data_dir = os.path.join(os.path.expanduser('~'), 'nltk_data')
os.makedirs(nltk_data_dir, exist_ok=True)
nltk.data.path.append(nltk_data_dir)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', download_dir=nltk_data_dir)

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', download_dir=nltk_data_dir)
    # also try downloading punkt_tab which is sometimes needed in newer NLTK versions
    nltk.download('punkt_tab', download_dir=nltk_data_dir)

ps = PorterStemmer()
stop_words = set(stopwords.words('english'))

def preprocess_text(text):
    """
    Preprocess the input text by:
    1. Lowercasing
    2. Tokenizing
    3. Removing non-alphanumeric characters
    4. Removing stopwords
    5. Stemming
    """
    # 1. Lowercasing
    text = text.lower()
    
    # 2. Tokenization
    tokens = nltk.word_tokenize(text)
    
    # 3. Removing punctuation & non-alphanumeric characters
    # 4. Stopword removal
    # 5. Stemming
    y = []
    for i in tokens:
        if i.isalnum() and i not in stop_words:
            y.append(ps.stem(i))
            
    return " ".join(y)
