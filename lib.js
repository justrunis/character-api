export function getCharactersWithClosestBirthdays(allCharacters) {
    let today = new Date();
    let currentMonth = today.getMonth() + 1;
    let currentDay = today.getDate();

    for (let i = 0; i < allCharacters.length; i++) {
        let characterBirthday = allCharacters[i].birthday.split("-");
        let characterMonth = parseInt(characterBirthday[0]);
        let characterDay = parseInt(characterBirthday[1]);
        let characterYear = new Date().getFullYear();
        
        if(characterMonth < currentMonth || (characterMonth === currentMonth && characterDay < currentDay)){
            characterYear++;
        }
        let date = new Date(characterYear, characterMonth - 1, characterDay);
        allCharacters[i].birthdayDate = date;
        allCharacters[i].daysUntilBirthday = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    }
    return allCharacters.filter(character => character.daysUntilBirthday >= 0).sort((a, b) => a.birthdayDate - b.birthdayDate).slice(0, 5);
}
export default getCharactersWithClosestBirthdays;