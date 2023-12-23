import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { getCharactersWithClosestBirthdays } from "./lib.js";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from 'passport-local';
const { Pool } = pg;
import 'dotenv/config';


const app = express();
const port = 3000;
const saltRounds = 10;
const characterAmount = 5;

// Change to your own database
// Windows setup
const db = new Pool({
    user: "postgres",
    host: "localhost",
    database: "characters",
    password: "dbpassword123",
    port: 5432,
});
// Linux setup
// const db = new Pool({
//     user: "localhost",
//     host: "localhost",
//     database: "characters",
//     password: "dbpassword123",
//     port: 5433,
// });

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session handling using express-session
app.use(
    session({
        secret: process.env.PASSPORT_SECRET, // Secret used to sign the session ID cookie
        resave: false, // Do not save session if unmodified
        saveUninitialized: false, // Do not create a session until something is stored
        cookie: {
            maxAge: 3600000, // Session expiration time in milliseconds
            // secure: true, // Only transmit over HTTPS
            // httpOnly: true, // Restrict access from JavaScript
            // sameSite: 'strict' // Control cross-origin cookie usage
        },
    })
);
 
// Initialize Passport and use Passport sessions
app.use(passport.initialize());
app.use(passport.session());

// Check if email exists in the database
const emailExists = async (email) => {
    // Query the database to check if the email exists
    const data = await query("SELECT * FROM users WHERE email=$1", [email]);
   
    // Return the user data if found, otherwise return false
    if (data.rowCount == 0) return false;
    return data.rows[0];
};

const usernameExists = async (username) => {
    // Query the database to check if the email exists
    const data = await query("SELECT * FROM users WHERE username=$1", [username]);
   
    // Return the user data if found, otherwise return false
    if (data.rowCount == 0) return false;
    return data.rows[0];
}

// Create a new user in the database
const createUser = async (username, email, password, date_of_birth, gender) => {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
   
    // Get the current time
    const currentTime = new Date().toISOString();
   
    // Insert the new user into the database and return the user data
    const data = await query(
        "INSERT INTO users(username, email, password, date_of_birth, gender, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username, email, date_of_birth, gender, role, created_at, updated_at",
        [username, email, hash, date_of_birth, gender, "user", currentTime, currentTime]
    );
   
    // Return the newly created user
    if (data.rowCount == 0) return false;
    return data.rows[0];
};
 
// Match entered password with the hashed password from the database
const matchPassword = async (password, hashPassword) => {
    // Compare the entered password with the hashed password
    const match = await bcrypt.compare(password, hashPassword);
    return match
};
 
// Passport strategy for user registration
passport.use("local-register", new LocalStrategy({ passReqToCallback: true }, async (req, email, password, done) => {
    try {
        const { date_of_birth, gender, name } = req.body;

        // Check if the user already exists
        const isEmail = await emailExists(email);
        const isUsername = await usernameExists(name);
 
        // If user or email exists, return with message
        if (isEmail) {
            return done(null, false, {message: "Email is already in use"});
        }
        if(isUsername) {
            return done(null, false, {message: "Username is already in use"});
        }
 
        // Create a new user and return the user object
        const user = await createUser(name, email, password, date_of_birth, gender);
        return done(null, user);
    } catch (error) {
        done(error);
    }
}));
 
// Passport strategy for user login
passport.use("local-login", new LocalStrategy(async (email, password, done) => {
    try {
        // Find the user in the database
        const user = await emailExists(email);
        const messageText = "Incorrect email or password";
        
        // If user doesn't exist, return message
        if (!user) return done(null, false, {message: messageText});
        
        // Check if the password matches
        const isMatch = await matchPassword(password, user.password);
        
        // Return user object if password matches, otherwise return message
        if (!isMatch) return done(null, false, {message: messageText});
        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));
 
// Serialize user information for session management
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user information for session management
passport.deserializeUser(async (id, done) => {
    try {
        // Find the user by ID and return the user object
        const response = await query('SELECT * FROM users WHERE id = $1', [id]);
        const user = response.rows[0];
        done(null, user);
    } catch (error) {
        done(error, false);
    }
});

/**
 * Function to make database queries
 * @param {*} sql query string
 * @param {*} params query parameters
 * @returns query result
 */
async function query(sql, params) {
    const client = await db.connect();
    try {
        // remove the logs later
        if (params) {
            console.log("SQL:", sql, params);
            return await client.query(sql, params);
        } else {
            console.log("SQL:", sql);
            return await client.query(sql);
        }
    } finally {
        client.release(); 
    }
}

// Get all characters
async function getCharacters() {
    const result = await query("SELECT * FROM characters ORDER BY name COLLATE \"C\"");
    return result.rows;
}

// Search for a character by name
function searchCharacterByName(sortName, allData) {
    if(sortName === undefined) return allData;
    const sortedCharacters = allData.filter(character => character.name.toLowerCase().includes(sortName.toLowerCase()));
    return sortedCharacters;
}

// Sort characters by element
function getCharactersByElement(sortElement, allData) {
    if(sortElement === undefined) return allData;
    const sortedCharacters = allData.filter(character => character.element === sortElement);
    return sortedCharacters;
}

// Sort characters by weapon
function getCharactersByWeapon(sortWeapon, allData) {
    if(sortWeapon === undefined) return allData;
    const sortedCharacters = allData.filter(character => character.weapon === sortWeapon);
    return sortedCharacters;
}

// Get character by id
async function getCharacterById(id) {
    const result = await query("SELECT * FROM characters WHERE id = $1", [id]);
    return result.rows[0];
}

let characters = getCharacters();

// Get add page
app.get("/addCharacter", async (req, res) => {
    if(req.isAuthenticated()) {
        res.render("addCharacter.ejs");
    }
    else{
        res.redirect("/");
    }
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

        const sqlQuery = `INSERT INTO characters (name, element, weapon, rarity, birthday, region, wiki_url, image_url, constellation, affiliation, talent_material_type, boss_material_type) 
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


        await query(sqlQuery, values);
        
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Get all characters
app.get("/characters", async (req, res) => {
    if(req.isAuthenticated()) {
        try {
            const characters = await getCharacters();
            res.render('allCharacters.ejs', { characters });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    }
    else{
        res.redirect("/");
    }
});

// Get edit page
app.get("/edit/:id", (req, res) => {
    if(req.isAuthenticated()){
        res.render("editCharacter.ejs", { character: characters[req.params.id] });
    }
    else{
        res.redirect("/");
    }
});

// Get a single character
app.get("/character/:id", async (req, res) => {
    if(req.isAuthenticated()) {
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
    } else{
        res.redirect("/");
    }
});

// Get edit page
app.get("/editCharacter/:id", async (req, res) => {
    if(req.isAuthenticated()) {
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
    } else {
        res.redirect("/");
    }
});

// Delete a character
app.get("/deleteCharacter/:id", async (req, res) => {
    if(req.isAuthenticated()){
        try {
            const id = parseInt(req.params.id);
            await query("DELETE FROM characters WHERE id = $1", [id]);
            res.redirect("/");
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.redirect("/");
    }
});

// Update a character
app.post("/character/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const character = (await characters).find((character) => character.id === id);
        const getCharacterByIdQuery = "SELECT * FROM characters WHERE id = $1";
        const currentCharacter = await query(getCharacterByIdQuery, [id]);

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

            await query(updateQuery, values);

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
    if(req.isAuthenticated()) {
        try {
            res.render('closestBirthday.ejs', { characters: getCharactersWithClosestBirthdays(await getCharacters(), characterAmount) });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.redirect("/");
    }
});

// Search/Sort for a character
// Todo: fix the sort
app.get('/search', async (req, res) => {
    if(req.isAuthenticated()) {
        console.log(req.query);
        let result = await getCharacters();
        if(req.query.name){
            result = searchCharacterByName(req.query.name, result);
        }
    
        // Sort characters by element if sortElement is provided
        if (req.query.sortElement) {
            result = getCharactersByElement(req.query.sortElement, result);
        }
        
        // Sort characters by weapon if sortWeapon is provided
        if (req.query.sortWeapon) {
            result = getCharactersByWeapon(req.query.sortWeapon, result);
        }
        
        res.render('allCharacters.ejs', { characters: result });
    } else {
        res.redirect("/");
    }
});

// All routes

// Login page
app.get('/', (req, res) => {
    res.render('login.ejs');
});

// Register page
app.get('/register', (req, res) => {
    res.render('register.ejs');
});

// Login form submission route
app.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) { 
            return res.render('login.ejs', { message: info.message });
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/characters');
        });
    })(req, res, next);
});
 
// Registration form submission route
app.post('/register', function(req, res, next) {
    passport.authenticate('local-register', function(err, email, info) {
      if (err) { return next(err); }
      if (!email) { 
          res.render('register.ejs', {message: info.message});
          return;
      }
      res.redirect('/characters');
    })(req, res, next);
  });

// Logout route
app.get("/logout",(req,res)=>{
    res.clearCookie("connect.sid"); // Clear the cookies left on client-side
    req.logOut(()=>{
        res.redirect("/"); // Redirect to the home page after logout
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

