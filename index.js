import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { getCharactersWithClosestBirthdays } from "./lib.js";


const app = express();
const port = 3000;

// Change to your own database
const db = new pg.Client({
    user: "localhost",
    host: "localhost",
    database: "characters",
    password: "dbpassword123",
    port: 5433,
});
db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function getCharacters() {
    const result = await db.query("SELECT * FROM characters ORDER BY name");
    return result.rows;
}

async function getCharacterById(id) {
    const result = await db.query("SELECT * FROM characters WHERE id = $1", [id]);
    return result.rows[0];
}

async function searchCharacterByName(name) {
    name = name.toLowerCase();
    const searchQuery = "SELECT * FROM characters WHERE LOWER(name) LIKE LOWER($1)";
    const result = await db.query(searchQuery, [`%${name}%`]);
    return result.rows;
}

let characters = getCharacters();

// Get add page
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
        
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Get all characters
app.get("/", async (req, res) => {
    try {
        const characters = await getCharacters();
        res.render('index.ejs', { characters });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Get edit page
app.get("/edit/:id", (req, res) => {
    res.render("editCharacter.ejs", { character: characters[res.params.id] });
});

// Get a single character
app.get("/character/:id", async (req, res) => {
    try {
        const character = await getCharacterById(parseInt(req.params.id));
        if (character) {
            res.render("viewCharacter.ejs", { character });
        } else {
            res.status(404).json({ message: `Character with id: ${req.params.id} not found` });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Get edit page
app.get("/editCharacter/:id", async (req, res) => {
    try {
        const character = await getCharacterById(parseInt(req.params.id));
        if (character) {
            res.render("editCharacter.ejs", { character });
        } else {
            res.status(404).json({ message: `Character with id: ${req.params.id} not found` });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a character
app.get("/deleteCharacter/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.query("DELETE FROM characters WHERE id = $1", [id]);
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Update a character
// Needs fixing
app.post("/character/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const character = (await characters).find((character) => character.id === id);
        const getCharacterByIdQuery = "SELECT * FROM characters WHERE id = $1";
        const currentCharacter = await db.query(getCharacterByIdQuery, [id]);

        if (character) {
            const updateQuery = `UPDATE characters SET name = $1, element = $2, weapon = $3, rarity = $4, birthday = $5, region = $6, wiki_url = $7, image_url = $8, constellation = $9, affiliation = $10, talent_material_type = $11, boss_material_type = $12 WHERE id = $13`;
            const values = [
                req.body.name || currentCharacter.rows[0].name,
                req.body.element || currentCharacter.rows[0].element,
                req.body.weapon || currentCharacter.rows[0].weapon,
                req.body.rarity || currentCharacter.rows[0].rarity,
                req.body.birthday ? req.body.birthday.slice(5, req.body.birthday.length) : currentCharacter.rows[0].birthday,
                req.body.region || currentCharacter.rows[0].region,
                req.body.wiki_url || currentCharacter.rows[0].wiki_url,
                req.body.image_url || currentCharacter.rows[0].image_url,
                req.body.constellation || currentCharacter.rows[0].constellation,
                req.body.affiliation || currentCharacter.rows[0].affiliation,
                req.body.talent_material_type || currentCharacter.rows[0].talent_material_type,
                req.body.boss_material_type || currentCharacter.rows[0].boss_material_type,
                id
            ];

            await db.query(updateQuery, values);

            res.redirect("/");
        } else {
            res.status(404).json({ message: `Character with id: ${id} not found for update` });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/birthday' , async (req, res) => {
    try {
        res.render('closestBirthday.ejs', { characters: getCharactersWithClosestBirthdays(await getCharacters()) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/search', async (req, res) => {
    const name = req.query.name;
    const characters = await searchCharacterByName(name);
    res.render('index.ejs', { characters });
});

app.get('/sort', async (req, res) => {
    // todo: implement sort
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

