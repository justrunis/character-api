/**
 * Retrieves characters with closest birthdays from the given array of characters.
 * 
 * @param {Array} allCharacters - The array of characters.
 * @param {number} characterAmount - The number of characters to retrieve.
 * @returns {Array} - The filtered array of characters with closest birthdays.
 */
export function getCharactersWithClosestBirthdays(allCharacters, characterAmount) {
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
    return allCharacters.filter(character => character.daysUntilBirthday >= 0).sort((a, b) => a.birthdayDate - b.birthdayDate).slice(0, characterAmount);
}

/**
 * Retrieves all characters with their average rating.
 * @param {*} allCharacters - The array of characters.
 * @param {*} allRatings - The array of ratings.
 * @returns {Array} - The array of characters with their average rating.
 */
export function getAllCharactersAverageRating(allCharacters, allRatings) {

    const reverseRatingValues = [
        'SS', //0
        'S', //1
        'A', //2
        'B',
        'C',
        'D'
    ].reverse();

    let charactersAverageRating = [];
    for (let i = 0; i < allCharacters.length; i++) {
        let characterAverageRating = 0;
        let characterRatings = Array.isArray(allRatings) ? allRatings.filter(rating => rating.character_id === allCharacters[i].id) : [];
        if (characterRatings.length > 0) {
            characterAverageRating = characterRatings.reduce((total, current) => total + reverseRatingValues.indexOf(current.ranking), 0);
            // for (let j = 0; j < characterRatings.length; j++) {
            //     characterAverageRating += ratingValues[characterRatings[j].ranking];
            // }
            characterAverageRating = Math.round(characterAverageRating / characterRatings.length);
            charactersAverageRating.push({ character: allCharacters[i], rating: reverseRatingValues[characterAverageRating] });
        }
    }
    console.log(charactersAverageRating);
    return charactersAverageRating;
}

/**
 * Calculates the pager.
 * @param {*} page - The current page.
 * @param {*} characters - The array of characters.
 * @param {*} pageSize - The page size.
 * @returns {Array} - The array of characters for the current page.
 */
export function calculatePager(page, characters, pageSize){
    if(!page) page = 1;
    const startIndex = (page - 1) * pageSize;

    const totalPages = Math.ceil(characters.length / pageSize);

    if (page > totalPages) {
        page = 1;
    }

    const paginatedCharacters = characters.slice(startIndex, startIndex + pageSize);

    return { characters: paginatedCharacters, totalPages: totalPages, currentPage: page };

}

export default {
    getCharactersWithClosestBirthdays,
    getAllCharactersAverageRating,
    calculatePager
};
