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