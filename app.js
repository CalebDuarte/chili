const cartStore = "chilisCart"
const azTax = 0.056
//tracks which cart line currently has its edit box open, so it stays open after renderAllCart() redraws everything. null means none are open
let openEditId = null

//cart-data
function getCart(){
    //localstorage only stores strings so JSON.parse it back into a real array
    const saved = localStorage.getItem(cartStore)
    if(!saved){
        return [] //nothing saved yet, so start with an empty cart
    }
    return JSON.parse(saved)
}

function saveCart(cartArray){
    localStorage.setItem(cartStore, JSON.stringify(cartArray))
}

function formatMoney(num){
    //toFixed(2) so we always get 5.00 and not just plain 5
    return "$" + num.toFixed(2)
}

function findMenuItem(id){
    //menuItems comes from menu-data.js, which has to load before this file
    for(let i = 0; i < menuItems.length; i++){
        if(menuItems[i].id === id){
            return menuItems[i]
        }
    }
    return null //in case the id doesnt match anything
}

function addToCart(id){
    const menuItem = findMenuItem(id)
    if(!menuItem) return //id didnt match a real menu item, dont add anything

    //some items come in more than one size, which means price is an array instead of a plain number just use the first size for now
    let price = menuItem.price
    if(Array.isArray(price)){
        price = price[0].price
    }

    const cart = getCart()
    let existingLine = null

    //check if this item is already in the cart so we dont make a duplicate line
    for(let i = 0; i < cart.length; i++){
        if(cart[i].id === id){
            existingLine = cart[i]
        }
    }

    if(existingLine){
        existingLine.qty = existingLine.qty + 1
    } else{
        cart.push({
            id: menuItem.id,
            name: menuItem.name,
            price: price,
            qty: 1,
            removedIngredients: [] // nothing removed yet
        })
    }

    saveCart(cart)
    renderAllCart()
}

function changeQty(id, amount){
    const cart = getCart()
    const newCart = []

    for(let i = 0; i < cart.length; i++){
        const line = cart[i]
        if(line.id === id){
            line.qty = line.qty + amount
            //if the qty drops to 0 or below, leave it out of the new cart
            if(line.qty > 0){
                newCart.push(line)
            }
        } else{
            newCart.push(line)
        }
    }

    saveCart(newCart)
    renderAllCart()
}

function removeFromCart(id){
    //filter builds a new array of everything that does NOT match the id
    const cart = getCart().filter(function(line){
        return line.id !== id
    })
    saveCart(cart)
    renderAllCart()
}

function toggleIngredient(cartId, ingredientName){
    //edit feature - check/uncheck an ingredient on an item already in the cart
    const cart = getCart()

    for(let i = 0; i < cart.length; i++){
        if(cart[i].id === cartId){
            const removedList = cart[i].removedIngredients
            const spot = removedList.indexOf(ingredientName)

            if(spot === -1){
                removedList.push(ingredientName) //wasnt removed yet, so remove it now
            } else{
                removedList.splice(spot, 1) //was already removed, put it back
            }
        }
    }

    saveCart(cart)
    renderAllCart()
}

function getSubtotal(){
    //price times qty added up for every line, this is BEFORE tax
    const cart = getCart()
    let subtotal = 0
    for(let i = 0; i < cart.length; i++){
        subtotal = subtotal + (cart[i].price * cart[i].qty)
    }
    return subtotal
}

function getCartCount(){
    //total items, not number of lines (2 burgers + 1 fries = 3, not 2)
    const cart = getCart()
    let count = 0
    for(let i = 0; i < cart.length; i++){
        count = count + cart[i].qty
    }
    return count
}


//rec items
// looks at whats in the cart and checks each item's pairsWith list from menu-data.js to suggest stuff thats not already in the cart

function getRecommendedItems(){
    const cart = getCart()
    const idsInCart = cart.map(function(line){ return line.id })
    const suggestions = []

    for(let i = 0; i < cart.length; i++){
        const menuItem = findMenuItem(cart[i].id)
        if(!menuItem || !menuItem.pairsWith) continue //nothing to suggest for this item

        for(let j = 0; j < menuItem.pairsWith.length; j++){
            const pairedId = menuItem.pairsWith[j]
            if(idsInCart.indexOf(pairedId) === -1 && suggestions.indexOf(pairedId) === -1){
                suggestions.push(pairedId)
            }
        }
    }

    return suggestions.slice(0, 3).map(findMenuItem).filter(Boolean) //3 suggestions max
}


//cart popup
// built once with JS and added to whatever page is open, so it doesnt need to be pasted into every page's html just link this file

function buildCartPopup(){
    if(document.getElementById("cartPopup")) return //already built

    const overlay = document.createElement("div")
    overlay.id = "cartOverlay"
    overlay.className = "cart-overlay"
    overlay.onclick = closeCart //clicking the dark background closes the cart

    const popup = document.createElement("div")
    popup.id = "cartPopup"
    popup.className = "cart-popup"
    popup.innerHTML =
        '<div class="cart-popup-top">' +
            "<h2>Your Order</h2>" +
            '<button onclick="closeCart()">&times;</button>' +
        "</div>" +
        '<div id="cartLines"></div>' +
        '<div id="cartRecommend"></div>' +
        '<div class="cart-subtotal">' +
            "<span>Subtotal</span>" +
            '<span id="cartSubtotal">$0.00</span>' +
        "</div>" +
        '<a href="pages/checkout/" class="btn cart-checkout-btn">Checkout</a>'

    document.body.appendChild(overlay)
    document.body.appendChild(popup)
}

function openCart(){
    document.getElementById("cartPopup").classList.add("open")
    document.getElementById("cartOverlay").classList.add("open")
}

function closeCart(){
    document.getElementById("cartPopup").classList.remove("open")
    document.getElementById("cartOverlay").classList.remove("open")
}

function toggleCart(){
    //clicking the cart button shows it, clicking again hides it
    const popup = document.getElementById("cartPopup")
    if(popup.classList.contains("open")){
        closeCart()
    } else{
        openCart()
    }
}

function toggleEditBox(cartId){
    //clicking Edit again on the same line just closes it
    openEditId = (openEditId === cartId) ? null : cartId
    renderAllCart()
}

function buildEditBoxHtml(line){
    const menuItem = findMenuItem(line.id)
    if(!menuItem || !menuItem.ingredients || menuItem.ingredients.length === 0){
        return '<p class="edit-note">Nothing to customize on this one.</p>'
    }

    let html = '<p class="edit-note">Uncheck anything you want left off:</p>'
    for(let i = 0; i < menuItem.ingredients.length; i++){
        const ingredient = menuItem.ingredients[i]
        const isRemoved = line.removedIngredients.indexOf(ingredient) !== -1
        html +=
            '<label class="edit-check">' +
                '<input type="checkbox" onchange="toggleIngredient(\'' + line.id + '\', \'' + ingredient + '\')" ' + (isRemoved ? "" : "checked") + ">" +
                ingredient +
            "</label>"
    }
    return html
}

function renderAllCart(){
    //redraws the whole cart popup, called any time the cart changes so it always matches whats saved in localstorage
    const cart = getCart()
    const linesContainer = document.getElementById("cartLines")

    if(!linesContainer) return //popup hasnt been built on this page yet

    linesContainer.innerHTML = ""

    if(cart.length === 0){
        linesContainer.innerHTML = '<p class="cart-empty">Your cart is empty</p>'
    } else{
        for(let i = 0; i < cart.length; i++){
            const line = cart[i]
            const lineTotal = line.price * line.qty

            //shows "No bacon, No cheese" under the name if its been edited
            let removedText = ""
            if(line.removedIngredients.length > 0){
                removedText = '<p class="removed-text">No ' + line.removedIngredients.join(", ") + "</p>"
            }

            const row = document.createElement("div")
            row.className = "cart-line"
            row.innerHTML =
                '<div class="cart-line-top">' +
                    "<span>" + line.name + "</span>" +
                    "<span>" + formatMoney(lineTotal) + "</span>" +
                "</div>" +
                removedText +
                '<div class="cart-line-bottom">' +
                    '<button class="qty-btn" onclick="changeQty(\'' + line.id + '\', -1)">-</button>' +
                    "<span>" + line.qty + "</span>" +
                    '<button class="qty-btn" onclick="changeQty(\'' + line.id + '\', 1)">+</button>' +
                    '<button class="edit-btn" onclick="toggleEditBox(\'' + line.id + '\')">Edit</button>' +
                    '<button class="remove-btn" onclick="removeFromCart(\'' + line.id + '\')">Remove</button>' +
                "</div>" +
                //only show the edit box for whichever line was clicked
                (openEditId === line.id ? '<div class="edit-box">' + buildEditBoxHtml(line) + "</div>" : "")

            linesContainer.appendChild(row)
        }
    }

    renderRecommendations()

    const subtotalEl = document.getElementById("cartSubtotal")
    if(subtotalEl){
        subtotalEl.textContent = formatMoney(getSubtotal())
    }

    //keeps the little number on the cart button up to date
    const countEl = document.getElementById("cartCount")
    if(countEl){
        countEl.textContent = getCartCount()
    }
}

function renderRecommendations(){
    const container = document.getElementById("cartRecommend")
    if(!container) return

    const recs = getRecommendedItems()

    if(recs.length === 0){
        container.innerHTML = ""
        return
    }

    let html = '<p class="recommend-title">You might also like</p><div class="recommend-list">'
    for(let i = 0; i < recs.length; i++){
        html +=
            '<div class="recommend-card">' +
                "<span>" + recs[i].name + "</span>" +
                "<span>" + formatMoney(recs[i].price) + "</span>" +
                '<button class="recommend-add-btn" onclick="addToCart(\'' + recs[i].id + '\')">Add</button>' +
            "</div>"
    }
    html += "</div>"
    container.innerHTML = html
}

// ===================== DARK MODE =====================
// toggles a class on <body>, which shared/style.css uses to swap colors.
// this used to be copy-pasted into a <script> tag on just index.html, so
// pages that didnt have that exact script never got dark mode at all.
// now every page gets it automatically just by linking this file.

function switchTheme(){
    document.body.classList.toggle("dark-mode")
}


//start functions
document.addEventListener("DOMContentLoaded", function(){
    buildCartPopup()
    renderAllCart()

    const cartBtn = document.getElementById('cartBtn')
    if(cartBtn){
        cartBtn.addEventListener("click", toggleCart)
    }
})