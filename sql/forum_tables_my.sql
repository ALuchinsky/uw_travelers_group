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
  author_ID VARCHAR(100) default 'Alex',
  text TEXT,
  date DATE,
  FOREIGN KEY (room_ID) REFERENCES rooms(room_ID)
);

DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
  room_ID INT NOT NULL PRIMARY KEY,
  theme_ID INT NOT NULL,
  topic VARCHAR(100),
  creator_ID VARCHAR(100) default 'Alex',
  num_replies INT NOT NULL DEFAULT 0,
  num_vists INT NOT NULL DEFAULT 0,
  last_reply_ID INT DEFAULT 0,
  FOREIGN KEY (theme_ID) REFERENCES themes(theme_ID)
);

DROP TABLE IF EXISTS themes CASCADE;
CREATE TABLE themes (
  theme_ID INT NOT NULL PRIMARY KEY,
  topic TEXT,
  description TEXT,
  creator_ID VARCHAR(100) default 'Alex',
  num_themes INT DEFAULT 0,
  num_replies INT DEFAULT 0
--  last_reply_ID INT NOT NULL,
--  FOREIGN KEY (last_reply_ID) REFERENCES forum_messages(message_ID)
);

INSERT INTO forum_messages (message_ID, room_ID, author_ID, text, date)
VALUES
    (0, 0, 'Alex', 'Welcome to the club!', 'May 1, 2025'),
    (1, 1, 'Alex', 'You are welcome to ask any questions here', 'May 1, 2025'),
    (2, 2, 'Dasha', 'Hi there', 'May 10, 2025'),
    (3, 3, 'John', 'What do you think about going to Hawaii', 'May 3, 2025'),
    (4, 3, 'Dasha', 'I like it!', 'May 3, 2025!'),
    (5, 4, 'John', 'I would like to make a new presentation', 'May 10, 2025'),
    (6, 5, 'Alex', 'Are there any hosting volunteers?', 'May 10, 2025'),
    (7, 6, 'Alex', 'I am just Alex, you know about me', 'May 2, 2025')
    ;


INSERT INTO themes (theme_ID, topic, description, creator_ID)
VALUES
    (0, 'For Newbies', 'New users should visit these rooms first', 'Alex'),
    (1, 'New travel groups', 'Place to discuss your travel plans and find companions', 'Alex'),
    (2, 'Presentations Schedule', 'All proposals about future presentations', 'Dasha'),
    (3, 'Tea room', 'Just chat', 'Alex');

INSERT INTO rooms (room_ID, theme_ID, topic, creator_ID)
VALUES
    (0, 0, 'Welcome to our CLUB forum', 'Alex'),
    (1, 0, 'Frequently asked questions', 'Alex'),
    (2, 1, 'New group idea', 'Alex'),
    (3, 1, 'What about Hawaii?', 'John'),
    (4, 2, 'New Presentation Proposals', 'Dasha'),
    (5, 2, 'I volunteer to host', 'John'),
    (6, 2, 'Tell us about yourself', 'Alex')
    ;

