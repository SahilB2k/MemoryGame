# app.py
from flask import Flask, render_template, jsonify, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import random
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///memory_game.db'
app.config['SECRET_KEY'] = secrets.token_hex(32)  # Use a secure random key
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    scores = db.relationship('Score', backref='user', lazy=True)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    moves = db.Column(db.Integer, nullable=False)
    time = db.Column(db.Integer, nullable=False)  # Time in seconds
    mode = db.Column(db.String(10), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

with app.app_context():
    db.create_all()

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
            return render_template('login.html')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/')
def index():
    if 'user_id' in session:
        return render_template('index.html')
    else:
        return redirect(url_for('login'))

@app.route('/start_game', methods=['POST'])
def start_game():
    mode = request.json.get('mode', '4x4')
    rows, cols = map(int, mode.split('x'))
    emojis = ["💐", "🌹", "🌻", "🏵️", "🌺", "🌴", "🌈", "🍓", "🍒", "🍎", "🍉", "🍊", "🥭", "🍍", "🍋", "🍏", "🍐", "🥝", "🍇", "🥥", "🍅", "🌶️", "🍄", "🧅", "🥦", "🥑", "🍔", "🍕", "🧁", "🎂", "🍬", "🍩", "🍫", "🎈"]
    items = random.sample(emojis, (rows * cols) // 2) * 2
    random.shuffle(items)
    return jsonify({'cards': items})

@app.route('/save_score', methods=['POST'])
def save_score():
    if 'user_id' in session:
        data = request.json
        new_score = Score(moves=data['moves'], time=data['time'], mode=data['mode'], user_id=session['user_id'])
        db.session.add(new_score)
        db.session.commit()
        return jsonify({'message': 'Score saved'})
    else:
        return jsonify({'message': 'User not logged in'}), 401

@app.route('/get_username')
def get_username():
    if 'user_id' in session:
        user = User.query.filter_by(id=session['user_id']).first()
        if user:
            return jsonify({'username': user.username})
        else:
            return jsonify({'error': 'User not found'}), 404
    else:
        return jsonify({'error': 'User not logged in'}), 401

if __name__ == '__main__':
    app.run(debug=False,host='0.0.0.0',port=5000)