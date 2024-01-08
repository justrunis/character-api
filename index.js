import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import * as lib from "./lib.js";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from 'passport-local';
const { Pool } = pg;
import 'dotenv/config';


const app = express();

const port = 3000; // Port number for the server
const saltRounds = 10; // Number of salt rounds for bcrypt
const pageSize = 6; // Number of characters per page
const characterAmount = 6; // Number of characters with closest birthdays

// Change to your own database
// Windows setup
// const db = new Pool({
//     user: "postgres",
//     host: "localhost",
//     database: "characters",
//     password: "dbpassword123",
//     port: 5432,
// });
// Linux setup
const db = new Pool({
    user: "localhost",
    host: "localhost",
    database: "characters",
    password: "dbpassword123",
    port: 5433,
});

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
    const result = await query("SELECT * FROM characters ORDER BY name");
    return result.rows;
}

// Get all users
async function getUsers(){
    const result = await query("SELECT * FROM users ORDER BY id");
    return result.rows;
}

// Get user by id
async function getUserById(id){
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
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

async function getCharacterRankingById(character_id, user_id) {
    console.log("CHARACTER ID " + character_id);
    console.log("USER ID " + user_id);
    const result = await query("SELECT ranking FROM character_ranking WHERE character_id = $1 AND user_id = $2", [character_id, user_id]);
    console.log("RANKING ", result.rows[0]?.ranking);
    return result.rows[0]?.ranking;
}

let characters = await getCharacters();
let users = await getUsers();

// Get add page
app.get("/addCharacter", async (req, res) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
        res.render("addCharacter.ejs");
    } else {
        res.redirect("/characters");
    }
});

// Create a new character
app.post("/add", async (req, res) => {
    if(req.isAuthenticated() && req.user.role === "admin"){
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
            
            res.redirect("/characters");
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.redirect("/characters");
    }
});

// Get all characters
app.get("/characters", async (req, res) => {
    let page = parseInt(req.query.page);
    if(req.isAuthenticated()) {
        
        console.log("NAME PARAM "+req.query.name);
        console.log("ELEMENT PARAM "+req.query.sortElement);
        console.log("WEAPON PARAM "+req.query.sortWeapon);
        console.log("PAGE PARAM "+req.query.page);
        
        let result = await getCharacters();
        
        // Search for characters by name if name is provided
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
        let { characters, totalPages, currentPage } = lib.calculatePager(page, result, pageSize);
        console.log("CHANGED CURRENT PAGE " + req.query.page);
        res.render('allCharacters.ejs', { characters: characters, user: req.user, totalPages: totalPages, currentPage: currentPage, query: req.query });
        
    } else {
        res.redirect("/");
    }
});

// Get all users
app.get("/users", async (req, res) =>{
    if(req.isAuthenticated() && req.user.role === "admin"){
        try {
            const users = await getUsers();
            res.render('allUsers.ejs', {users: users, user: req.user});
        } catch (error){
            console.log(error);
            res.status(500).json({error: error.message});
        }
    } else{
        res.redirect('/characters');
    }
});

// Get edit page
app.get("/edit/:id", (req, res) => {
    if(req.isAuthenticated() && req.user.role === "admin"){
        res.render("editCharacter.ejs", { character: characters[req.params.id] });
    }
    else{
        res.redirect("/characters");
    }
});

// Get a single character
app.get("/character/:id", async (req, res) => {
    if(req.isAuthenticated()) {
        try {
            const character = await getCharacterById(parseInt(req.params.id));
            if (character) {
                const characterRanking = await getCharacterRankingById(character.id, req.user.id);
                console.log("RANK " + characterRanking);
                res.render("viewCharacter.ejs", { character: character, user: req.user, characterRanking: characterRanking });
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

// Get users profile
app.get("/profile/:id", async (req, res) => {
    if(req.isAuthenticated() && req.user.id === parseInt(req.params.id)){
        try {
            const user = await getUserById(parseInt(req.params.id));
            if(user) {
                res.render("profile.ejs", { user: user});
            } else {
                res.status(404).json({ message: `User with id: ${req.params.id} not found` });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else{
        res.redirect("/");
    }
});

// Get edit character page
app.get("/editCharacter/:id", async (req, res) => {
    if(req.isAuthenticated() && req.user.role === "admin") {
        try {
            const character = await getCharacterById(parseInt(req.params.id));
            if (character) {
                res.render("editCharacter.ejs", { character: character, user: req.user });
            } else {
                res.status(404).json({ message: `Character with id: ${req.params.id} not found` });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.redirect("/characters");
    }
});

// Get edit user page
app.get("/editUser/:id", async (req, res) => {
    if(req.isAuthenticated() && req.user.role === "admin") {
        try {
            let user = await getUserById(parseInt(req.params.id));
            console.log(user);
            if (user) {
                res.render("editUser.ejs", { user });
            } else {
                res.status(404).json({ message: `User with id: ${req.params.id} not found` });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.redirect("/characters");
    }
});

app.get("/tierlist", async (req, res) => {
    if(req.isAuthenticated()) {
        try {
            let characterWithRatings = lib.getAllCharactersAverageRating(await getCharacters(), (await query("SELECT * FROM character_ranking")).rows);
            console.log("AVERAGE RATINGS:");
            characterWithRatings.forEach((character) => {
                console.log("Character: " + character.character.name);
                console.log("Rating: " + character.rating);
            });
            res.render("characterTierlist.ejs", { characters: characterWithRatings, user: req.user });
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
    if(req.isAuthenticated() && req.user.role === "admin"){
        try {
            const id = parseInt(req.params.id);
            await query("DELETE FROM characters WHERE id = $1", [id]);
            res.redirect("/characters");
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.redirect("/characters");
    }
});

// Delete a user
app.get("/deleteUser/:id", async (req, res) => {
    if(req.isAuthenticated() && req.user.role === "admin"){
        try {
            const id = parseInt(req.params.id);
            await query("DELETE FROM users WHERE id = $1", [id]);
            res.redirect("/users");
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.redirect("/characters");
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

            res.redirect("/characters");
        } else {
            res.status(404).json({ message: `Character with id: ${id} not found for update` });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Update a user
app.post("/user/:id", async (req, res) => {
    if(req.isAuthenticated() && req.user.role === "admin"){
        try {
            const id = parseInt(req.params.id);
            const user = (await users).find((user) => user.id === id);
            const getUserByIdQuery = "SELECT * FROM users WHERE id = $1";
            const currentUser = await query(getUserByIdQuery, [id]);
            console.log("DATE OF BIRTH "+req.body.date_of_birth);

            if (user) {
                const updateQuery = `UPDATE users SET username = $1, email = $2, date_of_birth = $3, gender = $4, role = $5, updated_at = $6 WHERE id = $7`;
                const values = [
                    req.body.username || currentUser.rows[0].username,
                    req.body.email || currentUser.rows[0].email,
                    req.body.date_of_birth || currentUser.rows[0].date_of_birth,
                    req.body.gender || currentUser.rows[0].gender,
                    req.body.role || currentUser.rows[0].role,
                    new Date().toISOString(),
                    id
                ];

                await query(updateQuery, values);
                res.redirect("/users");
            }
            else{
                res.status(404).json({ message: `User with id: ${id} not found for update` });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
}
});

// Update a user's profile
app.post("/profile/:id", async (req, res) => {
    if(req.isAuthenticated() && req.user.id === parseInt(req.params.id)){
        try {
            console.log(req);
            const id = parseInt(req.params.id);
            const user = (await users).find((user) => user.id === id);
            const getUserByIdQuery = "SELECT * FROM users WHERE id = $1";
            const currentUser = await query(getUserByIdQuery, [id]);

            if(user){
                const updateQuery = `UPDATE users SET date_of_birth = $1, gender = $2, updated_at = $3 WHERE id = $4`;
                const values = [
                    req.body.date_of_birth ? req.body.date_of_birth : currentUser.rows[0].date_of_birth,
                    req.body.gender ? req.body.gender : currentUser.rows[0].gender,
                    new Date().toISOString(),
                    id
                ];
                await query(updateQuery, values);
                res.redirect("/profile/"+id);
            }else{
                res.status(404).json({ message: `User with id: ${id} not found for update` });
            }
            
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }
});

app.post("/rateCharacter/:id", async (req, res) => {
    if(req.isAuthenticated()){
        try {
            const id = parseInt(req.params.id);
            const character = (await characters).find((character) => character.id === id);
            const getCharacterByIdQuery = "SELECT * FROM characters WHERE id = $1";
            const currentCharacter = await query(getCharacterByIdQuery, [id]);

            const currentRatingQuery = "SELECT ranking FROM character_ranking WHERE user_id = $1 AND character_id = $2";
            const currentRating = await query(currentRatingQuery, [req.user.id, id]);

            if(currentRating.rows.length > 0){
                if (character) {
                    const updateQuery = `UPDATE character_ranking SET ranking = $1, updated_at = $2 WHERE user_id = $3 AND character_id = $4`;
                    const values = [
                        req.body.rating,
                        new Date().toISOString(),
                        req.user.id,
                        id
                    ];
    
                    await query(updateQuery, values);
    
                    res.redirect("/character/"+id);
                } else {
                    res.status(404).json({ message: `Character with id: ${id} not found for update` });
                }
            }
            else{
                if (character) {
                const createQuery = `INSERT INTO character_ranking (user_id, character_id, ranking, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`;
                const values = [
                    req.user.id,
                    id,
                    req.body.rating,
                    new Date().toISOString(),
                    new Date().toISOString()
                ];

                await query(createQuery, values);

                res.redirect("/character/"+id);
                } else {
                    res.status(404).json({ message: `Character with id: ${id} not found for update` });
                }
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }
});

// Get characters with closest birthdays
app.get('/birthday' , async (req, res) => {
    if(req.isAuthenticated()) {
        try {
            res.render('closestBirthday.ejs', { characters: lib.getCharactersWithClosestBirthdays(await getCharacters(), characterAmount), user: req.user });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.redirect("/");
    }
});

// ALL ROUTES BELOW

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

