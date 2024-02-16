import string
import random
from datetime import datetime
from flask import *
from functools import wraps
import sqlite3
import traceback


app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.secret_key = 'dummy_secret_key'


def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def render_with_error_handling(template, **kwargs):
    try:
        return render_template(template, **kwargs)
    except:
        t = traceback.format_exc()
        return render_template('error.html', args={"trace": t}), 500

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u

def get_user_from_cookie(request):
    user_id = request.cookies.get('user_id')
    password = request.cookies.get('user_password')
    if user_id and password:
        return query_db('select * from users where id = ? and password = ?', [user_id, password], one=True)
    return None

# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
user_sessions = {}

@app.route('/')
def render_SC():
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_SC')
    return render_with_error_handling('index.html', user=user, room=None)

@app.route('/profile')
def render_profile():
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_profile')
        return redirect('/login')
    return render_template('index.html', user=user, room=None)

@app.route('/login')
def render_login():
    user = get_user_from_cookie(request)
    if user is not None:
        print('Current session already logged in')
        next_page = session.pop('next', None)
        if next_page:
            #print(str(next_page))
            return redirect(next_page)
        else:
            return redirect('/')
    return render_template('index.html', user=user, room=None)

@app.route('/room/<int:room_id>')
def render_room(room_id):
    user = get_user_from_cookie(request)
    if user is None:
        session['next'] = url_for('render_room', room_id=room_id)
        return redirect('/login')
    room = query_db('select * from rooms where id = ?', [room_id], one=True)
    return render_with_error_handling('index.html', room=room, user=user)

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404



# -------------------------------- API ROUTES ----------------------------------
# TODO: Create the API
def verify_api(request, user):
    key = request.headers.get('x-api-key')
    db_key = query_db("select api_key from users where id = ?",
                      [user['id']], one=True)['api_key']
    if key == db_key:
        return True
    else:
        print('API authentication failed')
        return jsonify({"error": "unauthorized API key"}), 406

@app.route('/api/get_roomlist', methods=['GET'])
def get_roomlist():
    rooms = query_db('''
select id, name from rooms
                     ''')
    if rooms is None:
        return jsonify('No rooms')
    else:
        return jsonify([{"id": room['id'], "name": room['name']} for room in rooms])

@app.route('/api/new_room', methods=['GET'])
def create_room():
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)
    
    result = query_db('''
insert into rooms (name) values ('Unamed Room') returning id, name
                        ''', one=True)
    return jsonify({'id': result['id'], 'name': result['name']})

@app.route('/api/get_messages/rooms/<int:room_id>', methods=['GET'])
def get_messages(room_id):
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)
    
    messages = query_db('''
select messages.id, users.name as author, messages.body, messages.room_id
from messages inner join users on messages.user_id = users.id
where messages.room_id = ?
                        ''', [room_id])
    #print('author:', messages[0]['author'])
    if messages is None:
        #print('no message')
        return jsonify('No message in this room yet!')
    else:
        return jsonify([{'author': msg['author'], 'body': msg['body']} for msg in messages])

@app.route('/api/post_message/rooms/<int:room_id>', methods=['POST'])
def post_message(room_id):
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)

    user_id = request.cookies.get('user_id')
    message = request.json.get('comment')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 405
    query = """
insert into messages (user_id, room_id, body) values (?, ?, ?)
            """
    query_db(query, [user_id, room_id, message], one=True)
    print('new message inserted to DB')
    return jsonify({'success': True})

@app.route('/api/update_roomname/<int:room_id>', methods=['POST'])
def update_roomname(room_id):
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)
    
    new_name = request.json.get('name')
    if not new_name:
        return jsonify({'error': 'No room name provided'}), 402
    
    query = """
update rooms set name = ? where id = ?
            """
    query_db(query, [new_name, room_id], one=True)
    print('room name updated')
    return jsonify({'success': True})

@app.route('/api/get_room_name/rooms/<int:room_id>', methods=['GET'])
def get_roomname(room_id):
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)
    
    result = query_db('''
select name from rooms where id = ?
                        ''', [room_id], one=True)
    if result is None:
        return jsonify('Room error!')
    else:
        return jsonify({'roomName': result['name']})

@app.route('/api/user/name', methods=['POST'])
def update_username():
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)
    
    user_id = request.cookies.get('user_id')
    new_name = request.json.get('username')
    if not new_name:
        return jsonify({'error': 'No username provided'}), 400
    query = """
update users set name = ? where id = ?
            """
    query_db(query, [new_name, user_id], one=True)
    print('username updated')
    return jsonify({'success': True})

@app.route('/api/user/password', methods=['POST'])
def update_password():
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)
    
    user_id = request.cookies.get('user_id')
    name = request.json.get('username')
    new_password = request.json.get('password')
    if not new_password:
        return jsonify({'error': 'No password provided'}), 401
    
    query = """
update users set password = ? where id = ?
            """
    query_db(query, [new_password, user_id], one=True)
    resp = make_response(jsonify({'redirectUrl': url_for('render_profile')}))
    resp.set_cookie('user_password', str(new_password))
    print('password updated')
    return resp

@app.route('/api/signup', methods=['GET'])
def signup():
    user = new_user()
    next_page = session.pop('next', None)
    if next_page:
        print(str(next_page))
        resp = make_response(jsonify({'redirectUrl': next_page}))
    else:
        resp = make_response(jsonify({'redirectUrl': url_for('render_SC')}))
    resp.set_cookie('user_id', str(user['id']))
    resp.set_cookie('user_password', str(user['password']))
    return resp

@app.route('/api/login', methods=['POST'])
def login():
    name = request.json.get('username')
    password = request.json.get('password')
    print(name, password)
        
    query = """
select id from users where name = ? and password = ?
            """
    result = query_db(query, [name, password], one=True)
    if result is None:
        print('user not in db')
        return jsonify('User not identified')

    next_page = session.pop('next', None)
    if next_page:
        print(str(next_page))
        resp = make_response(jsonify({'redirectUrl': next_page}))
    else:
        resp = make_response(jsonify({'redirectUrl': url_for('render_SC')}))
    resp.set_cookie('user_id', str(result['id']))
    resp.set_cookie('user_password', str(password))
    return resp

@app.route('/api/logout', methods=['GET'])
def logout():
    user = get_user_from_cookie(request)
    if verify_api(request, user) is not True:
        return verify_api(request, user)

    resp = make_response(jsonify({'redirectUrl': url_for('render_SC')}))
    resp.set_cookie('user_id', '')
    resp.set_cookie('user_password', '')
    return resp
