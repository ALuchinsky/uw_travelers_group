DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users  (
  user_ID INT NOT NULL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  num_messages INT DEFAULT 0
);

INSERT INTO users (user_ID, name, email)
VALUES 
  (0, 'Alex', 'aluchi@bgsu.edu'),
  (1, 'Dasha', 'dfilippova@gmail.com'),
  (2, 'John', 'john@gmail.com')
;

DROP TABLE IF EXISTS forum_messages CASCADE;
CREATE TABLE forum_messages (
  message_ID INT NOT NULL PRIMARY KEY,
  room_ID INT NOT NULL,
  author_ID INT NOT NULL,
  text TEXT,
  date DATE,
  FOREIGN KEY (author_ID) REFERENCES users(user_ID)
);

DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
  room_ID INT NOT NULL PRIMARY KEY,
  theme_ID INT NOT NULL,
  topic VARCHAR(100),
  creator_ID INT NOT NULL,
  num_replies INT NOT NULL DEFAULT 0,
  num_vists INT NOT NULL DEFAULT 0,
  last_reply_ID INT DEFAULT 0,
  FOREIGN KEY (creator_ID) REFERENCES users(user_ID)
 ,FOREIGN KEY (last_reply_ID) REFERENCES forum_messages(message_ID)
);

DROP TABLE IF EXISTS themes CASCADE;
CREATE TABLE themes (
  theme_ID INT NOT NULL PRIMARY KEY,
  topic TEXT,
  description TEXT,
  creator_ID INT DEFAULT 0,
  num_themes INT DEFAULT 0,
  num_replies INT DEFAULT 0,
  last_reply_ID INT DEFAULT 0,
  FOREIGN KEY (creator_ID) REFERENCES users(user_ID)
, FOREIGN KEY (last_reply_ID) REFERENCES forum_messages(message_ID)
);

INSERT INTO forum_messages (message_ID, room_ID, author_ID, text, date)
VALUES
    (0, 0, 0, 'Welcome to the club!', 'May 1, 2025'),
    (1, 1, 0, 'You are welcome to ask any questions here', 'May 1, 2025'),
    (2, 2, 1, 'Hi there', 'May 10, 2025'),
    (3, 3, 2, 'What do you think about going to Hawaii', 'May 3, 2025'),
    (4, 3, 1, 'I like it!', 'May 3, 2025!'),
    (5, 4, 2, 'I would like to make a new presentation', 'May 10, 2025'),
    (6, 5, 0, 'Are there any hosting volunteers?', 'May 10, 2025'),
    (7, 6, 0, 'I am just Alex, you know about me', 'May 2, 2025')
    ;


INSERT INTO themes (theme_ID, topic, description, creator_ID)
VALUES
    (0, 'For Newbies', 'New users should visit these rooms first', 0),
    (1, 'New travel groups', 'Place to discuss your travel plans and find companions', 0),
    (2, 'Presentations Schedule', 'All proposals about future presentations', 1),
    (3, 'Tea room', 'Just chat', 0);

INSERT INTO rooms (room_ID, theme_ID, topic, creator_ID)
VALUES
    (0, 0, 'Welcome to our CLUB forum', 0),
    (1, 0, 'Frequently asked questions', 0),
    (2, 1, 'New group idea', 0),
    (3, 1, 'What about Hawaii?', 2),
    (4, 2, 'New Presentation Proposals', 1),
    (5, 2, 'I volunteer to host', 2),
    (6, 2, 'Tell us about yourself', 0)
    ;

