import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import GenshinCharacter from "./models/genshinCharacter.js";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "characters",
    password: "dbpassword123",
    port: 5432,
});
db.connect();

let characters = [];

// Fetch all characters from the database
const fetchAllCharactersFromDatabase = () => {

    db.query("SELECT * FROM Characters", (err, res) => {
        if (err) {
            console.error("Error executing query", err.stack);
        } else {
            characters = res.rows;
        }
    });
    return characters;
};

fetchAllCharactersFromDatabase();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/addCharacter", async (req, res) => {
    res.render("addCharacter.ejs");
});

// Create a new character
app.post("/add", async (req, res) => {
    try {
        const {
            name,
            element,
            weapon,
            rarity,
            birthday,
            region,
            wiki_url,
            image_url,
            constellation,
            affiliation,
            talent_material_type,
            boss_material_type
        } = req.body;

        const query = `INSERT INTO characters (name, element, weapon, rarity, birthday, region, wiki_url, image_url, constellation, affiliation, talent_material_type, boss_material_type) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;

        const values = [
            name,
            element,
            weapon,
            rarity,
            birthday.slice(5, birthday.length),
            region,
            wiki_url,
            image_url,
            constellation,
            affiliation,
            talent_material_type,
            boss_material_type
        ];


        await db.query(query, values);
        characters.push({
            name,
            element,
            weapon,
            rarity,
            birthday: birthday.slice(5, birthday.length),
            region,
            wiki_url,
            image_url,
            constellation,
            affiliation,
            talent_material_type,
            boss_material_type
        });

        
        res.redirect("/");
    } catch (error) {
        res.status(500).json({ message: "Internal server error: " + error.message });
    }
});

// Get all characters
app.get("/", (req, res) => {
    try {
        fetchAllCharactersFromDatabase();
        characters.sort((a, b) => a.name.localeCompare(b.name));
        res.render("index.ejs", { characters });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get edit page
app.get("/edit/:id", (req, res) => {
    res.render("editCharacter.ejs", { character: characters[res.params.id] });
});

// Get a single character
app.get("/character/:id", (req, res) => {
    try {
        console.log(req.params.id);
        const id = parseInt(req.params.id);
        const character = characters.find((character) => character.id === id);
        if (character) {
            res.render("viewCharacter.ejs", { character });
        } else {
            res.status(404).json({ message: `Character with id: ${id} not found` });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/editCharacter/:id", (req, res) => {
    console.log(req.params.id);
    try {
        const id = parseInt(req.params.id);
        const character = characters.find((character) => character.id === id);
        if (character) {
            res.render("editCharacter.ejs", { character });
        } else {
            res.status(404).json({ message: `Character with id: ${id} not found` });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete a character
app.get("/deleteCharacter/:id", async (req, res) => {
    try {
        console.log(req.params.id);
        const id = parseInt(req.params.id);
        console.log(id);
        await db.query("DELETE FROM characters WHERE id = $1", [id]);
        characters = characters.filter((character) => character.id !== id);
        res.redirect("/");
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update a character
// Needs fixing
app.post("/character/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(id);
        const character = characters.find((character) => character.id === id);
        const getCharacterByIdQuery = "SELECT * FROM characters WHERE id = $1";
        const currectCharacter = await db.query(getCharacterByIdQuery, [id]);
        console.log(currectCharacter.rows[0].name);

        
        if (character) {
            const { name, element, weapon, 
                rarity, birthday, region, wiki_url, 
                image_url, constellation, affiliation,
                talent_material_type, boss_material_type } = req.params;
            
            const updateQuery = `UPDATE characters SET name = $1, element = $2, weapon = $3, rarity = $4, birthday = $5, region = $6, wiki_url = $7, image_url = $8, constellation = $9, affiliation = $10, talent_material_type = $11, boss_material_type = $12 WHERE id = $13`;
            const values = [
                name || currectCharacter.rows[0].name,
                element || currectCharacter.rows[0].element,
                weapon || currectCharacter.rows[0].weapon,
                rarity || currectCharacter.rows[0].rarity,
                birthday ? birthday.slice(5, birthday.length) : currectCharacter.rows[0].birthday,
                region || currectCharacter.rows[0].region,
                wiki_url || currectCharacter.rows[0].wiki_url,
                image_url || currectCharacter.rows[0].image_url,
                constellation || currectCharacter.rows[0].constellation,
                affiliation || currectCharacter.rows[0].affiliation,
                talent_material_type || currectCharacter.rows[0].talent_material_type,
                boss_material_type || currectCharacter.rows[0].boss_material_type,
                id
            ];

            await db.query(updateQuery, values);
                
            character.name = name || character.name;
            character.element = element || character.element;
            character.weapon = weapon || character.weapon;
            character.rarity = rarity || character.rarity;
            character.birthday = birthday ? birthday.slice(5, birthday.length) : character.birthday;
            character.region = region || character.region;
            character.wiki_url = wiki_url || character.wiki_url;
            character.image_url = image_url || character.image_url;
            character.constellation = constellation || character.constellation;
            character.affiliation = affiliation || character.affiliation;
            character.talent_material_type = talent_material_type || character.talent_material_type;
            character.boss_material_type = boss_material_type || character.boss_material_type;


            res.redirect("/");
        } else {
            res.status(404).json({ message: `Character with id: ${id} not found for update` });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

