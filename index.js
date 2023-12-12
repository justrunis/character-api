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
    database: "Characters",
    password: "dbpassword123",
    port: 5432,
  });
  
  db.connect();


let characters = [];

db.query("SELECT * FROM Characters", (err, res) => {
    if (err) {
      console.error("Error executing query", err.stack);
    } else {
      characters = res.rows;
    }
    db.end();
  });
  

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/addCharacter", async (req, res) => {
    res.render("addCharacter.ejs");
});

// Create a new character
app.post("/add", (req, res) => {
    try {
        db.query(`INSERT INTO characters (name, weapon, element, rarity, birthday, region, wiki_url, image_url, affiliation, talent_material_type, boss_material_type) VALUES ('Justinas', 'Sword', 'Anemo', 4, '12-07', 'Other', 'https://stackoverflow.com/questions/8054165/using-put-method-in-html-form', 'https://stackoverflow.com/questions/8054165/using-put-method-in-html-form', 'ggg', 'ssss', 'ddd');`, (err) => {
            if (err) {
                console.error("Error executing query", err.stack);
                return res.status(500).json({ message: "Internal server error" });
            }
            res.redirect("/");
        });
        db.end();
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all characters
app.get("/", (req, res) => {
    try {
        characters.sort((a, b) => a.name.localeCompare(b.name));
        res.render("index.ejs", { characters });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get edit page
app.get("/edit/:id", (req, res) => {
    console.log(characters);
    res.render("editCharacter.ejs", { character: characters[res.params.id] });
});

// Get a single character
app.get("/character/:id", (req, res) => {
    try {
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
app.get("/deleteCharacter/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        deleteCharacterSQL(id);
        res.redirect("/");
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

function deleteCharacterSQL(id){
    if (id == null || id == undefined || id == "" || isDigit(id) == false) {
        return res.status(403).json({ message: "Invalid id" });
    }
    db.query("DELETE FROM Characters WHERE id = $1", [id], (err, res) => {
        if (err) {
          console.error("Error executing query", err.stack);
        } else {
          characters = res.rows;
        }
        db.end();
      });
}


// Update a character
app.patch("/character/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(id);
        const character = characters.find((character) => character.id === id);
        if (character) {
            const { name, element, weapon, 
                rarity, birthday, region, wiki_url, 
                image_url, constellation, affiliation,
                talent_material_type, boss_material_type } = req.body;
                
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

            res.status(200).json({ message: "Character updated successfully", character });
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

