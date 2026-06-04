import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Folder setup for images
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///standups.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class StandupPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author = db.Column(db.String(100))
    yesterday = db.Column(db.Text)
    today = db.Column(db.Text)
    blockers = db.Column(db.Text)
    has_blocker = db.Column(db.Boolean)
    file_path = db.Column(db.String(200))
    weather_stat = db.Column(db.String(50)) # Stores the weather at time of post
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/standups', methods=['GET'])
def get_posts():
    posts = StandupPost.query.order_by(StandupPost.timestamp.desc()).all()
    return jsonify([{
        'author': p.author, 'yesterday': p.yesterday, 'today': p.today,
        'blockers': p.blockers, 'has_blocker': p.has_blocker,
        'timestamp': p.timestamp.strftime("%H:%M"), 
        'file': p.file_path,
        'weather': p.weather_stat
    } for p in posts])

@app.route('/standups', methods=['POST'])
def add_post():
    author = request.form.get('author')
    yesterday = request.form.get('yesterday')
    today = request.form.get('today')
    blockers = request.form.get('blockers')
    has_blocker = request.form.get('has_blocker') == 'true'
    weather_info = request.form.get('weather') # Received from React
    
    file_path = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            file_path = filename

    new_post = StandupPost(author=author, yesterday=yesterday, today=today, 
                           blockers=blockers, has_blocker=has_blocker, 
                           file_path=file_path, weather_stat=weather_info)
    db.session.add(new_post)
    db.session.commit()
    return jsonify({"message": "Saved!"}), 201

@app.route('/standups/stats', methods=['GET'])
def get_stats():
    stats = []
    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        count = StandupPost.query.filter(db.func.date(StandupPost.timestamp) == date).count()
        blockers = StandupPost.query.filter(db.func.date(StandupPost.timestamp) == date, StandupPost.has_blocker == True).count()
        stats.append({"name": date.strftime("%a"), "posts": count, "blockers": blockers})
    return jsonify(stats)

@app.route('/uploads/<filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, port=8000)