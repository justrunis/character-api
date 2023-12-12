export default class GenshinCharacter {
    constructor(id, name, element, weapon, rarity, birthday, region, wiki_url, image_url, constellation, affiliation, talent_material_type, boss_material_type) {
        this.id = id;
        this.name = name;
        this.element = element;
        this.weapon = weapon;
        this.rarity = rarity;
        this.birthday = birthday;
        this.region = region;
        this.wiki_url = wiki_url;
        this.image_url = image_url;
        this.constellation = constellation;
        this.affiliation = affiliation;
        this.talent_material_type = talent_material_type;
        this.boss_material_type = boss_material_type;
    }
}

