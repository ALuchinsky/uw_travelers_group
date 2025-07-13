-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  author text,
  content text,
  time time without time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

CREATE TABLE public.schedule2025 (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  Date date,
  Hosts text,
  Presenters text,
  Topic text,
  CONSTRAINT schedule2025_pkey PRIMARY KEY (id)
);

CREATE TABLE public.schedule_history (
  Date date,
  Hosts text,
  Presenters text,
  Topic text,
  author text,
  created_at date
);

-- forum tables

CREATE TABLE public.users (
  user_id integer NOT NULL,
  name character varying,
  email character varying,
  num_messages integer DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);

CREATE TABLE public.rooms (
  room_id integer NOT NULL,
  theme_id integer NOT NULL,
  topic character varying,
  creator_id integer NOT NULL,
  num_replies integer NOT NULL DEFAULT 0,
  num_vists integer NOT NULL DEFAULT 0,
  last_reply_id integer NOT NULL,
  CONSTRAINT rooms_pkey PRIMARY KEY (room_id),
  CONSTRAINT rooms_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(user_id),
  CONSTRAINT rooms_last_reply_id_fkey FOREIGN KEY (last_reply_id) REFERENCES public.forum_messages(message_id)
);


CREATE TABLE public.themes (
  theme_id integer NOT NULL,
  topic text,
  description text,
  creator_id integer NOT NULL,
  num_themes integer NOT NULL,
  num_replies integer NOT NULL,
  last_reply_id integer NOT NULL,
  CONSTRAINT themes_pkey PRIMARY KEY (theme_id),
  CONSTRAINT themes_last_reply_id_fkey FOREIGN KEY (last_reply_id) REFERENCES public.forum_messages(message_id),
  CONSTRAINT themes_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(user_id)
);


CREATE TABLE public.forum_messages (
  message_id integer NOT NULL,
  room_id integer NOT NULL,
  author_id integer NOT NULL,
  text text,
  date date,
  CONSTRAINT forum_messages_pkey PRIMARY KEY (message_id),
  CONSTRAINT forum_messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id)
);


INSERT INTO "public"."users" ("user_id", "name", "email", "num_messages") VALUES 
    ('0', 'Alex', 'aluchi@bgsu.edu', '0'),
    ('1', 'Dasha', 'dfilippova@gmail.com', '0'),
     ('2', 'John', 'john@gmail.com', '0');