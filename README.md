# 🎭 AI Avatar Generator with Lip-Sync Capabilities

A cutting-edge web application that generates realistic talking avatars from text input with perfect lip synchronization and facial alignment. Built with modern web technologies and AI-powered speech synthesis.

## ✨ Features

- **🎤 Text-to-Speech Generation**: Convert any text to natural-sounding speech
- **👄 Perfect Lip-Sync**: Real-time lip synchronization using viseme mapping
- **🎨 3D Avatar Rendering**: Realistic 3D avatars with Three.js
- **🌍 Multi-Language Support**: Support for 9+ languages
- **🎛️ Real-Time Controls**: Adjust speed, volume, and playback in real-time
- **📊 Audio Visualization**: Beautiful audio frequency visualization
- **🎯 Multiple Avatar Types**: Support for Ready Player Me and custom avatars
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Modern web browser with WebGL support
- Internet connection for avatar loading

### Installation

1. **Clone or download the project**
   ```bash
   cd ai_avatar_generator
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the backend server**
   ```bash
   cd backend
   python app.py
   ```

4. **Open the frontend**
   - Open `frontend/index.html` in your web browser
   - Or serve it through a local web server for better performance

### Alternative: Quick Start Script

```bash
# Make script executable (Linux/Mac)
chmod +x start.sh

# Run the startup script
./start.sh
```

## 🏗️ Architecture

### Backend (Python/Flask)
- **Text-to-Speech Engine**: Google TTS (gTTS) with Azure Cognitive Services support
- **Viseme Generation**: Audio analysis and phoneme-to-viseme mapping
- **RESTful API**: Clean API endpoints for frontend integration
- **Audio Processing**: Librosa for audio analysis and processing

### Frontend (HTML/CSS/JavaScript)
- **3D Rendering**: Three.js for WebGL-based avatar rendering
- **Avatar System**: Ready Player Me integration with fallback support
- **Lip-Sync Engine**: Real-time viseme-based facial animation
- **Audio Processing**: Web Audio API for visualization and playback
- **Responsive UI**: Modern CSS with dark theme and animations

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Generate Speech
```
POST /api/generate-speech
Content-Type: application/json

{
  "text": "Hello, I am an AI avatar!",
  "language": "en",
  "provider": "gtts"
}
```

### Get Viseme Mapping
```
GET /api/visemes/mapping
```

### Get Avatar Info
```
GET /api/avatar/info
```

## 🎯 Usage

1. **Load Avatar**: Select an avatar type or load a custom GLB/GLTF model
2. **Enter Text**: Type the text you want the avatar to speak
3. **Configure Settings**: Adjust language, speed, and volume
4. **Generate Speech**: Click "Generate Speech" to create audio with lip-sync
5. **Play & Enjoy**: Watch your avatar speak with perfect lip synchronization

## 🔧 Configuration

### Backend Configuration
```python
# Environment variables
PORT=5000              # Server port
DEBUG=True            # Debug mode
AZURE_SPEECH_KEY=     # Azure Cognitive Services key (optional)
AZURE_REGION=         # Azure region (optional)
```

### Frontend Configuration
```javascript
// API configuration in app.js
this.apiBaseUrl = 'http://localhost:5000/api';
```

## 🎨 Customization

### Adding Custom Avatars
1. Prepare GLB/GLTF model with morph targets for visemes
2. Upload to a publicly accessible URL
3. Select "Custom URL" in the avatar dropdown
4. Enter the URL when prompted

### Viseme Mapping
The system uses a 15-viseme mapping system:
- 0: Silence
- 1-7: Consonant sounds
- 8-14: Vowel sounds and diphthongs

### Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

## 🛠️ Development

### Project Structure
```
ai_avatar_generator/
├── backend/
│   ├── app.py                 # Main Flask application
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── index.html            # Main HTML file
│   ├── styles.css            # CSS styles
│   └── js/
│       ├── app.js            # Main application logic
│       ├── avatar-manager.js # 3D avatar management
│       ├── lip-sync-engine.js # Lip-sync animation
│       └── audio-processor.js # Audio handling
├── docs/
│   └── technical_analysis_report.md # Technical documentation
└── README.md
```

### Key Technologies
- **Backend**: Flask, gTTS, Librosa, NumPy
- **Frontend**: Three.js, Web Audio API, WebGL
- **3D Assets**: Ready Player Me, GLB/GLTF format
- **Audio**: MP3/WAV support with real-time processing

## 🔍 Troubleshooting

### Common Issues

**Avatar not loading:**
- Check internet connection
- Verify avatar URL is valid and accessible
- Try using the fallback geometric avatar

**Audio not playing:**
- Ensure browser supports Web Audio API
- Check volume settings and browser audio permissions
- Try refreshing the page

**Lip-sync not working:**
- Verify viseme data is being generated
- Check debug information panel
- Ensure avatar has proper morph targets

**API errors:**
- Verify backend server is running on port 5000
- Check network connectivity
- Review console logs for detailed error messages

### Performance Tips
- Use lower resolution avatars for better performance
- Close other browser tabs using WebGL
- Ensure stable internet connection for avatar loading

## 🔮 Future Enhancements

- **Real-time Voice Input**: Speech-to-text for live conversation
- **Emotion Detection**: Facial expressions based on text sentiment
- **Custom Avatar Creation**: Built-in avatar generation from photos
- **WebRTC Integration**: Real-time streaming capabilities
- **Mobile App**: Native mobile applications
- **Cloud Deployment**: Scalable cloud infrastructure

## 📄 License

This project is developed by MiniMax Agent for demonstration and educational purposes. Feel free to use and modify according to your needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📞 Support

For questions, issues, or feature requests, please refer to the project documentation or create an issue in the repository.

---

**Created with ❤️ by MiniMax Agent** - Pushing the boundaries of AI-powered avatar technology.
