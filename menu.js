// pages/menu/menu.js
// only runs on the menu page. loops through menuItems (from menu-data.js)
// and builds a food card for every item, dropping each one into the
// right section on the page based on its "type".

// which container id each "type" value belongs in. the html already has
// one shared Beverages section and one shared Dessert section instead of
// repeating drinks/desserts for every meal, so this just matches that.
const sectionContainers = {
    breakfast: "BreakfastFoodDiv",
    lunch: "LunchFoodDiv",
    dinner: "DinnerFoodDiv",
    beverage: "BeveragesFoodDiv",
    dessert: "DessertFoodDiv"
}

// figures out what to show for the price. most items are just a plain
// number, but a few (churros, sirloin, etc.) come in different sizes and
// are stored as an array instead - menu-data.js isnt fully consistent
// about calling the price key "price" or "Price" depending on the item,
// so this checks for both instead of assuming one
function getDisplayPrice(item){
    if(!Array.isArray(item.price)){
        return formatMoney(item.price)
    }

    let lowest = null
    for(let i = 0; i < item.price.length; i++){
        const optionPrice = item.price[i].price !== undefined ? item.price[i].price : item.price[i].Price
        if(lowest === null || optionPrice < lowest){
            lowest = optionPrice
        }
    }
    return "Starting at " + formatMoney(lowest)
}

// builds one food card and drops it into the given container
function renderFoodCard(item, containerId){
    const container = document.getElementById(containerId)
    if(!container) return //this page doesnt have this section

    const imageHtml = item.image
        ? '<img src="' + item.image + '" alt="' + item.name + '">'
        : '<div class="no-photo">Photo coming soon</div>'

    const kidsTag = item.kids ? '<span class="kids-tag">Kids</span>' : ""

    const card = document.createElement("div")
    card.className = "food-card"
    card.innerHTML =
        imageHtml +
        "<h3>" + item.name + kidsTag + "</h3>" +
        '<p class="food-desc">' + (item.description || "") + "</p>" +
        '<p class="food-price">' + getDisplayPrice(item) + "</p>" +
        '<button class="btn" onclick="addToCart(\'' + item.id + '\')">Add to Cart</button>'

    container.appendChild(card)
}

function renderMenu(){
    //the html has an empty placeholder div inside each section
    //(leftover from before this was hooked up) - clear those out first
    //so we dont end up with one blank card sitting next to the real ones
    for(const type in sectionContainers){
        const container = document.getElementById(sectionContainers[type])
        if(container) container.innerHTML = ""
    }

    for(let i = 0; i < menuItems.length; i++){
        const item = menuItems[i]

        //some items in menu-data.js have a typo or blank "type" field -
        //skip those instead of crashing the whole page on a bad entry
        if(!item.type) continue

        //lowercase this since a couple items in menu-data.js have
        //"Beverage" capitalized instead of "beverage"
        const containerId = sectionContainers[item.type.toLowerCase()]
        if(!containerId) continue //type doesnt match any of our 5 sections

        renderFoodCard(item, containerId)
    }
}

document.addEventListener("DOMContentLoaded", renderMenu)