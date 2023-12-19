import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { getCharactersWithClosestBirthdays } from "./lib.js";
import bcrypt from "bcrypt";


const app = express();
const port = 3000;
const saltRounds = 10;
const characterAmount = 5;

// Change to your own database
// const db = new pg.Client({
//     user: "postgres",
//     host: "postgres",
//     database: "characters",
//     password: "dbpassword123",
//     port: 5432,
// });
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

// Get all characters
async function getCharacters() {
    const result = await db.query("SELECT * FROM characters ORDER BY name");
    return result.rows;
}

async function getCharactersByElement(data) {
    const { name, sortWeapon, sortElement } = data;
    
    let query = "SELECT * FROM characters WHERE";
    const values = [];
    
    if (name) {
        query += " name = $1";
        values.push(name);
    }
    
    if (sortWeapon) {
        if (values.length > 0) {
            query += " AND";
        }
        query += " weapon = $2";
        values.push(sortWeapon);
    }
    
    if (sortElement) {
        if (values.length > 0) {
            query += " AND";
        }
        query += " element = $3";
        values.push(sortElement);
    }
    
    const result = await db.query(query, values);
    return result.rows;
}

async function getCharactersByWeapon(weapon, characters) {
    const result = await db.query("SELECT * FROM characters WHERE weapon = $1", [weapon]);
    return result.rows;
}

// Get character by id
async function getCharacterById(id) {
    const result = await db.query("SELECT * FROM characters WHERE id = $1", [id]);
    return result.rows[0];
}

// Search for a character by name
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
app.get("/characters", async (req, res) => {
    try {
        const characters = await getCharacters();
        res.render('allCharacters.ejs', { characters });
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

// Get characters with closest birthdays
app.get('/birthday' , async (req, res) => {
    try {
        res.render('closestBirthday.ejs', { characters: getCharactersWithClosestBirthdays(await getCharacters(), characterAmount) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Search/Sort for a character
app.get('/search', async (req, res) => {
    console.log(req.query);
    // let result = await searchCharacterByName(req.query.name);
    
    // // Sort characters by element if sortElement is provided
    // if (req.query.sortElement) {
    //     result = await getCharactersByElement(req.query.sortElement, result);
    // }
    
    // // Sort characters by weapon if sortWeapon is provided
    // if (req.query.sortWeapon) {
    //     result = await getCharactersByWeapon(req.query.sortWeapon, result);
    // }
    
    // res.render('allCharacters.ejs', { characters: result });
});

// Login page
app.get('/', (req, res) => {
    res.render('login.ejs');
});

// Login submition
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [username];
    const result = await db.query(query, values);
    console.log(result.rows);

    if (result.rows.length === 0) {
        res.render('login.ejs', { error: 'No user with this email adress' });
    } else {
        const user = result.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            res.redirect('/characters');
        } else {
            res.render('login.ejs', { error: 'Incorrect password' });
        }
    }
});

// Register page
app.get('/register', (req, res) => {
    res.render('register.ejs');
});

// Registration submition
app.post('/register', async (req, res) => {
    const { username, email, date_of_birth, gender, password } = req.body;
    try {
        // Check if email or username already exists
        const checkQuery = `SELECT * FROM users WHERE email = $1 OR username = $2`;
        const checkValues = [email, username];
        const checkResult = await db.query(checkQuery, checkValues);

        if (checkResult.rows.length > 0) {
            res.render('register.ejs', { error: 'Email or username already exists' });
            return;
        }

        // Check if passwords match
        if (password !== req.body.confirm_password) {
            res.render('register.ejs', { error: 'Passwords do not match' });
            return;
        }

        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const defaultRole = 'user';

        const query = `INSERT INTO users (username, email, date_of_birth, gender, role, password, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
        const values = [
            username,
            email,
            date_of_birth,
            gender,
            defaultRole,
            hashedPassword,
            new Date(),
            new Date()
        ];
        db.query(query, values);
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

