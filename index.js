import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import GenshinCharacter from "./models/genshinCharacter.js";

const app = express();
const port = 3000;


// Dummy data
let characters = [
    new GenshinCharacter(1, "Diluc", "Pyro", "Claymore", 5, "04-30", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Diluc", "https://static.wikia.nocookie.net/gensin-impact/images/4/4a/Character_Diluc_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035958", "Noctua", "Knights of Favonius", "Freedom", "Dvalin"),
    new GenshinCharacter(2, "Keqing", "Electro", "Sword", 5, "11-20", "Liyue", "https://genshin-impact.fandom.com/wiki/Keqing", "https://static.wikia.nocookie.net/gensin-impact/images/2/2b/Character_Keqing_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Trulla", "Liyue Qixing", "Prosperity", "Childe"),
    new GenshinCharacter(3, "Klee", "Pyro", "Catalyst", 5, "07-27", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Klee", "https://static.wikia.nocookie.net/gensin-impact/images/5/5d/Character_Klee_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Trifolium", "Knights of Favonius", "Freedom", "Dvalin"),
    new GenshinCharacter(4, "Mona", "Hydro", "Catalyst", 5, "08-31", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Mona", "https://static.wikia.nocookie.net/gensin-impact/images/6/6d/Character_Mona_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Astrolabos", "Astrology", "Resistance", "Childe"),
    new GenshinCharacter(5, "Qiqi", "Cryo", "Sword", 5, "03-03", "Liyue", "https://genshin-impact.fandom.com/wiki/Qiqi", "https://static.wikia.nocookie.net/gensin-impact/images/5/5c/Character_Qiqi_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Pristina Nola", "Bubu Pharmacy", "Prosperity", "Childe"),
    new GenshinCharacter(6, "Venti", "Anemo", "Bow", 5, "06-16", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Venti", "https://static.wikia.nocookie.net/gensin-impact/images/7/7d/Character_Venti_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Carmen Dei", "Bard", "Freedom", "Dvalin"),
    new GenshinCharacter(7, "Tartaglia", "Hydro", "Bow", 5, "07-20", "Snezhnaya", "https://genshin-impact.fandom.com/wiki/Tartaglia", "https://static.wikia.nocookie.net/gensin-impact/images/8/8e/Character_Tartaglia_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Monoceros Caeli", "Fatui", "Resistance", "Childe"),
    new GenshinCharacter(8, "Xiao", "Anemo", "Polearm", 5, "04-17", "Liyue", "https://genshin-impact.fandom.com/wiki/Xiao", "https://static.wikia.nocookie.net/gensin-impact/images/9/9e/Character_Xiao_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Alatus Nemeseos", "Wangsheng Funeral Parlor", "Prosperity", "Childe"),
    new GenshinCharacter(9, "Hu Tao", "Pyro", "Polearm", 5, "07-15", "Liyue", "https://genshin-impact.fandom.com/wiki/Hu_Tao", "https://static.wikia.nocookie.net/gensin-impact/images/0/0e/Character_Hu_Tao_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Papilio Charontis", "Wangsheng Funeral Parlor", "Prosperity", "Childe"),
    new GenshinCharacter(10, "Zhongli", "Geo", "Polearm", 5, "12-31", "Liyue", "https://genshin-impact.fandom.com/wiki/Zhongli", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Zhongli_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Lapis Dei", "Wangsheng Funeral Parlor", "Prosperity", "Childe"),
    new GenshinCharacter(11, "Eula", "Cryo", "Claymore", 5, "10-25", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Eula", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Eula_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Spindrift Knight", "Knights of Favonius", "Resistance", "Dvalin"),
    new GenshinCharacter(12, "Ayaka", "Cryo", "Sword", 5, "09-28", "Inazuma", "https://genshin-impact.fandom.com/wiki/Ayaka", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Ayaka_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Kamisato Art", "Kamisato Clan", "Prosperity", "Childe"),
    new GenshinCharacter(13, "Yoimiya", "Pyro", "Bow", 5, "08-09", "Inazuma", "https://genshin-impact.fandom.com/wiki/Yoimiya", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Yoimiya_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Queen of the Summer Festival", "Naganohara Fireworks", "Freedom", "Dvalin"),
    new GenshinCharacter(14, "Sayu", "Anemo", "Claymore", 4, "07-19", "Inazuma", "https://genshin-impact.fandom.com/wiki/Sayu", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Sayu_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Shiyuumatsu-Ban", "Shiyuumatsu-Ban", "Resistance", "Childe"),
    new GenshinCharacter(15, "Yae Miko", "Electro", "Catalyst", 5, "11-13", "Inazuma", "https://genshin-impact.fandom.com/wiki/Yae_Miko", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Yae_Miko_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Reign of Serenity", "Kamisato Clan", "Prosperity", "Dvalin"),
    new GenshinCharacter(16, "Kokomi", "Hydro", "Catalyst", 5, "10-20", "Inazuma", "https://genshin-impact.fandom.com/wiki/Kokomi", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Kokomi_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Sangonomiya Priestess", "Sangonomiya Resistance", "Prosperity", "Childe"),
    new GenshinCharacter(17, "Sara", "Electro", "Bow", 4, "06-08", "Inazuma", "https://genshin-impact.fandom.com/wiki/Sara", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Sara_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Crowfeather", "Shogun's Army", "Resistance", "Dvalin"),
    new GenshinCharacter(18, "Rosaria", "Cryo", "Polearm", 4, "01-24", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Rosaria", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Rosaria_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Thorny Benevolence", "Church of Favonius", "Resistance", "Childe"),
    new GenshinCharacter(19, "Albedo", "Geo", "Sword", 5, "09-13", "Mondstadt", "https://genshin-impact.fandom.com/wiki/Albedo", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Albedo_Card.jpg/revision/latest/scale-to-width-down/250?cb=20201116035959", "Kreideprinz", "Knights of Favonius", "Prosperity", "Dvalin"),
    new GenshinCharacter(20, "Ganyu", "Cryo", "Bow", 5, "12-02", "Liyue", "https://genshin-impact.fandom.com/wiki/Ganyu", "https://static.wikia.nocookie.net/gensin-impact/images/1/1f/Character_Ganyu_Card.jpg", "Plenilune Gaze", "Yujing Terrace", "Prosperity", "Childe"),
];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/addCharacter", async (req, res) => {
    res.render("addCharacter.ejs");
});

// Create a new character
app.post("/add", (req, res) => {
    try {
        console.log(req.body);
        const { id, name, element, weapon, 
            rarity, birthday, region, wiki_url, 
            image_url, constellation, affiliation,
            talent_material_type, boss_material_type } = req.body;

        const newCharacter = new GenshinCharacter(characters.length + 1, name, element, weapon, 
            rarity, birthday.slice(5, birthday.length), region, wiki_url, 
            image_url, constellation, affiliation, talent_material_type, boss_material_type);

        characters.push(newCharacter);

        res.redirect("/");
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Read all characters
app.get("/", (req, res) => {
    try {
        characters.sort((a, b) => a.name.localeCompare(b.name));
        res.render("index.ejs", { characters });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/edit/:id", (req, res) => {
    res.render("editCharacter.ejs", { character: character[res.params.id] });
});

// Read a single character
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

app.get("/deleteCharacter/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        characters = characters.filter((character) => character.id !== id);
        res.redirect("/");
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});


// Update a character
app.patch("/character/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
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

// Delete a character
app.post("/characters/:id", (req, res) => {
    const id = req.params.id;
    console.log(id);
    const index = characters.findIndex((character) => character.id === id);
    console.log(characters)
    console.log(index);
    if (index !== -1) {
        characters.splice(index, 1);
        res.status(200).json({ message: `Character with id: ${id} deleted successfully` });
    } else {
        res.status(404).json({ message: `Character with id: ${id} not found for remove` });
    res.status(500).json({ message: "Internal server error" });

}});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

