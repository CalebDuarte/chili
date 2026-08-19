let cart = JSON.parse(localStorage.getItem("chilisCart"))|| [];
let details = document.getElementById("details");
console.log(cart)

for (let i = 0; i < cart.length; i++) {
    let item = cart[i];

    let itemTotal = item.price * item.qty;

    details.innerHTML += `
    <div class="checkout-item"> 
    <h2>${item.name}</h2>
    <p>qty: ${item.qty}</p>
    <p>price: ${itemTotal.toFixed(2)}</p>
    </div>`;
}
