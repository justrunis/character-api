-- Create table
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    element VARCHAR(50),
    weapon VARCHAR(50),
    rarity INT,
    birthday VARCHAR(5),
    region VARCHAR(50),
    wiki_url VARCHAR(255),
    image_url VARCHAR(255),
    constellation VARCHAR(50),
    affiliation VARCHAR(50),
    talent_material_type VARCHAR(50),
    boss_material_type VARCHAR(50)
);

-- Create table for users with timestamps
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN role VARCHAR(50) NOT NULL


-- Insert some Genshin characters
INSERT INTO characters (name, element, weapon, rarity, birthday, region, wiki_url, image_url, constellation, affiliation, talent_material_type, boss_material_type)
VALUES 
    ('Diluc', 'Pyro', 'Claymore', 5, '04-30', 'Mondstadt', 'https://genshin-impact.fandom.com/wiki/Diluc', 'https://static.wikia.nocookie.net/gensin-impact/images/3/3d/Diluc_Icon.png', 'Noctua', 'Knights of Favonius', 'Resistance', 'Dvalin'),
    ('Jean', 'Anemo', 'Sword', 5, '03-14', 'Mondstadt', 'https://genshin-impact.fandom.com/wiki/Jean', 'https://static.wikia.nocookie.net/gensin-impact/images/6/64/Jean_Icon.png', 'Leo Minor', 'Knights of Favonius', 'Dandelion', 'Dvalin'),
    ('Venti', 'Anemo', 'Bow', 5, '06-16', 'Mondstadt', 'https://genshin-impact.fandom.com/wiki/Venti', 'https://static.wikia.nocookie.net/gensin-impact/images/f/f1/Venti_Icon.png', 'Carmen Dei', 'Knights of Favonius', 'Ballad', 'Dvalin'),
    ('Keqing', 'Electro', 'Sword', 5, '11-20', 'Liyue', 'https://genshin-impact.fandom.com/wiki/Keqing', 'https://static.wikia.nocookie.net/gensin-impact/images/5/52/Keqing_Icon.png', 'Trulla Cementarii', 'Liyue Qixing', 'Prosperity', 'Andrius'),
    ('Mona', 'Hydro', 'Catalyst', 5, '08-31', 'Mondstadt', 'https://genshin-impact.fandom.com/wiki/Mona', 'https://static.wikia.nocookie.net/gensin-impact/images/4/41/Mona_Icon.png', 'Astrolabos', 'Knights of Favonius', 'Resistance', 'Dvalin'),
    ('Tartaglia', 'Hydro', 'Bow', 5, '07-20', 'Snezhnaya', 'https://genshin-impact.fandom.com/wiki/Tartaglia', 'https://static.wikia.nocookie.net/gensin-impact/images/8/85/Tartaglia_Icon.png', 'Monoceros Caeli', 'Fatui', 'Resistance', 'Andrius'),
    ('Zhongli', 'Geo', 'Polearm', 5, '12-31', 'Liyue', 'https://genshin-impact.fandom.com/wiki/Zhongli', 'https://static.wikia.nocookie.net/gensin-impact/images/a/a6/Zhongli_Icon.png', 'Lapis Dei', 'Liyue Qixing', 'Prosperity', 'Andrius'),
    ('Ganyu', 'Cryo', 'Bow', 5, '12-02', 'Liyue', 'https://genshin-impact.fandom.com/wiki/Ganyu', 'https://static.wikia.nocookie.net/gensin-impact/images/7/79/Ganyu_Icon.png', 'Sinae Unicornis', 'Liyue Qixing', 'Prosperity', 'Andrius'),
    ('Raiden Shogun', 'Electro', 'Polearm', 5, '10-13', 'Inazuma', 'https://genshin-impact.fandom.com/wiki/Raiden_Shogun', 'https://static.wikia.nocookie.net/gensin-impact/images/2/24/Raiden_Shogun_Icon.png', 'Transcendence', 'Shogunate', 'Prosperity', 'Signora'),
    ('Neuvillette', 'Hydro', 'Catalyst', 5, '12-18', 'Fontaine', 'https://genshin-impact.fandom.com/wiki/Neuvillette', 'https://static.wikia.nocookie.net/gensin-impact/images/2/21/Neuvillette_Icon.png', 'Leviathan Judicator', 'Fontaine', 'Order', 'Apep'),
    ('Kaedehara Kazuha', 'Anemo', 'Sword', 5, '10-29', 'Inazuma', 'https://genshin-impact.fandom.com/wiki/Kaedehara_Kazuha', 'https://static.wikia.nocookie.net/gensin-impact/images/e/e3/Kaedehara_Kazuha_Icon.png', 'Acer Palmatum', 'Inazuma', 'Resistance', 'Signora'),
    ('Yoimiya', 'Pyro', 'Bow', 5, '07-21', 'Inazuma', 'https://genshin-impact.fandom.com/wiki/Yoimiya', 'https://static.wikia.nocookie.net/gensin-impact/images/8/88/Yoimiya_Icon.png', 'Trifolium', 'Inazuma', 'Prosperity', 'Signora'),
    ('Sayu', 'Anemo', 'Claymore', 4, '10-19', 'Inazuma', 'https://genshin-impact.fandom.com/wiki/Sayu', 'https://static.wikia.nocookie.net/gensin-impact/images/2/22/Sayu_Icon.png', 'Nyctereutes Minor', 'Inazuma', 'Prosperity', 'Signora'),
    ('Layla', 'Cryo', 'Sword', 4, '12-19', 'Sumeru', 'https://genshin-impact.fandom.com/wiki/Layla', 'https://static.wikia.nocookie.net/gensin-impact/images/1/1a/Layla_Icon.png', 'Luscinia', 'Rtawahist', 'Ingenuity', 'Scaramouche')