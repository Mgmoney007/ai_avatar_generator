#!/usr/bin/env python3
"""
AI Avatar Generator Backend API
Provides text-to-speech with viseme generation for lip-sync capabilities
"""

import os
import io
import json
import base64
import tempfile
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import librosa
from gtts import gTTS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class VisemeMapper:
    """Maps phonemes to visemes for lip-sync animation"""
    
    # Standard viseme mapping based on common phonemes
    VISEME_MAP = {
        # Silence/pause
        'sil': 0, 'sp': 0, '': 0,
        
        # Consonants
        'p': 1, 'b': 1, 'm': 1,  # Bilabial sounds
        'f': 2, 'v': 2,          # Labiodental sounds
        'th': 3, 'dh': 3,        # Dental sounds
        't': 4, 'd': 4, 'n': 4, 'l': 4, 's': 4, 'z': 4,  # Alveolar sounds
        'sh': 5, 'zh': 5, 'ch': 5, 'jh': 5, 'r': 5,      # Post-alveolar sounds
        'k': 6, 'g': 6, 'ng': 6, 'y': 6, 'w': 6,         # Velar sounds
        'h': 7,                  # Glottal sounds
        
        # Vowels
        'aa': 8, 'ao': 8,        # Open back vowels (jaw open)
        'ae': 9, 'ah': 9,        # Open front vowels
        'eh': 10, 'er': 10,      # Mid vowels
        'ih': 11, 'iy': 11,      # Close front vowels
        'ow': 12, 'oo': 12, 'uh': 12, 'uw': 12,  # Back rounded vowels
        'ay': 13, 'ey': 13,      # Diphthongs
        'oy': 14, 'aw': 14,      # Complex diphthongs
    }
    
    def __init__(self):
        self.viseme_count = 15  # Total number of visemes (0-14)
    
    def phoneme_to_viseme(self, phoneme):
        """Convert phoneme to viseme ID"""
        # Clean and normalize phoneme
        phoneme = str(phoneme).lower().strip()
        return self.VISEME_MAP.get(phoneme, 0)  # Default to silence
    
    def generate_viseme_sequence(self, text, audio_duration):
        """Generate basic viseme sequence from text analysis"""
        words = text.lower().split()
        visemes = []
        
        # Simple approximation: distribute visemes across audio duration
        time_per_word = audio_duration / max(len(words), 1)
        
        current_time = 0.0
        for word in words:
            word_duration = time_per_word
            
            # Simple phonetic approximation based on common letter patterns
            viseme_sequence = self._word_to_visemes(word)
            viseme_duration = word_duration / max(len(viseme_sequence), 1)
            
            for viseme_id in viseme_sequence:
                visemes.append({
                    'viseme_id': viseme_id,
                    'time_offset': current_time,
                    'duration': viseme_duration
                })
                current_time += viseme_duration
        
        return visemes
    
    def _word_to_visemes(self, word):
        """Convert word to approximate viseme sequence"""
        visemes = []
        
        # Simple letter-to-viseme mapping for demonstration
        letter_to_viseme = {
            'a': 8, 'e': 10, 'i': 11, 'o': 12, 'u': 12,
            'p': 1, 'b': 1, 'm': 1,
            'f': 2, 'v': 2,
            't': 4, 'd': 4, 'n': 4, 'l': 4, 's': 4,
            'r': 5, 'ch': 5, 'sh': 5,
            'k': 6, 'g': 6, 'w': 6, 'y': 6,
            'h': 7,
        }
        
        for char in word:
            if char in letter_to_viseme:
                visemes.append(letter_to_viseme[char])
            else:
                visemes.append(0)  # Silence for unknown characters
        
        return visemes if visemes else [0]

class TTSService:
    """Text-to-Speech service with multiple provider support"""
    
    def __init__(self):
        self.viseme_mapper = VisemeMapper()
    
    def generate_speech_gtts(self, text, language='en'):
        """Generate speech using Google Text-to-Speech (gTTS)"""
        try:
            # Create TTS object
            tts = gTTS(text=text, lang=language, slow=False)
            
            # Save to bytes buffer
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Get audio duration (approximate)
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                temp_file.write(audio_buffer.getvalue())
                temp_file.flush()
                
                # Load audio to get duration
                y, sr = librosa.load(temp_file.name)
                duration = librosa.get_duration(y=y, sr=sr)
                
                # Clean up temp file
                os.unlink(temp_file.name)
            
            # Generate visemes
            visemes = self.viseme_mapper.generate_viseme_sequence(text, duration)
            
            audio_buffer.seek(0)
            return {
                'audio_data': audio_buffer.getvalue(),
                'duration': duration,
                'visemes': visemes,
                'sample_rate': sr,
                'format': 'mp3'
            }
            
        except Exception as e:
            logger.error(f"Error in gTTS generation: {str(e)}")
            raise

# Initialize services
tts_service = TTSService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'AI Avatar Generator API'
    })

@app.route('/api/generate-speech', methods=['POST'])
def generate_speech():
    """Generate speech audio with viseme data for lip-sync"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text input required'}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Empty text input'}), 400
        
        language = data.get('language', 'en')
        provider = data.get('provider', 'gtts')
        
        logger.info(f"Generating speech for text: '{text[:50]}...' with provider: {provider}")
        
        # Generate speech with visemes
        if provider == 'gtts':
            result = tts_service.generate_speech_gtts(text, language)
        else:
            return jsonify({'error': f'Unsupported provider: {provider}'}), 400
        
        # Encode audio data as base64 for JSON response
        audio_base64 = base64.b64encode(result['audio_data']).decode('utf-8')
        
        return jsonify({
            'success': True,
            'audio_data': audio_base64,
            'duration': result['duration'],
            'visemes': result['visemes'],
            'sample_rate': result['sample_rate'],
            'format': result['format'],
            'text': text,
            'language': language,
            'provider': provider
        })
        
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/visemes/mapping', methods=['GET'])
def get_viseme_mapping():
    """Get the viseme mapping information"""
    return jsonify({
        'viseme_map': tts_service.viseme_mapper.VISEME_MAP,
        'viseme_count': tts_service.viseme_mapper.viseme_count,
        'description': 'Standard viseme mapping for lip-sync animation'
    })

@app.route('/api/avatar/info', methods=['GET'])
def get_avatar_info():
    """Get information about supported avatar formats and features"""
    return jsonify({
        'supported_formats': ['GLB', 'GLTF'],
        'avatar_providers': ['Ready Player Me', 'Custom'],
        'animation_features': ['lip_sync', 'facial_expressions', 'eye_movement'],
        'viseme_count': tts_service.viseme_mapper.viseme_count,
        'real_time_capable': True
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting AI Avatar Generator API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
