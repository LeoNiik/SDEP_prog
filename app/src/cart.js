
const URL = 'ecommerce.web';
const PORT = '8000'

document.addEventListener('DOMContentLoaded', async (event) => {
    await refreshAll();
    removeItemListeners();
    checkOutCartListener();
}); 

async function refreshAll(){
    await refreshCart();
    await refreshBalance();
}

function removeItemListeners(){
    let products = document.querySelectorAll(".product-cart")
    products.forEach((product)=>{
        let button = product.querySelector('.remove-item-btn')
        product_id = button.id
        button.addEventListener('click', (event)=>{
            console.log('clicckato')

            deleteItem(product_id);
        });
    });
}

function checkOutCartListener(){
    let button = document.querySelector('.checkout');
    button.addEventListener('click', (event)=>{
        console.log('clicckato')

        checkOutCart();
    });
}


async function getRequest(url){
    const options = {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        }
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data)

        return data;
    } catch (error) {
        console.log('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}
async function postRequest(url,data){
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data)

        return data;
    } catch (error) {
        console.log('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}


//funzione per rimuovere un prodotto al carrello
async function deleteItem(product_id){
    const sessid = sessionStorage.getItem('sessid');

    const data = {sessid: sessid, product_id: product_id};
    console.log('[DEBUG] deleteItem data:', data)
    const response = await postRequest('http://'+URL+':'+PORT+'/api/delete_item/',data);
    console.log('[DEBUG] deleteItem response:', response)
    //aggiorno il carrello
    refreshCart();
    return response;
}


async function checkOutCart(){
    const id = sessionStorage.getItem('sessid');
    let data = getRequest(`http://${URL}:${PORT}/api/checkout/${id}`);
    if(data.status === 'success'){
        console.log(data);
    }
};
async function refreshBalance(){
    const balance = await getBalance()
    console.log(balance,'fefwefewfw')
    balanceDiv = document.getElementById('user-balance');
    balanceDiv.innerHTML = balance
}
async function getBalance(){
    const id = sessionStorage.getItem('sessid');
    let data = await getRequest(`http://${URL}:${PORT}/api/balance/${id}`);
    console.log(data);
    return data.balance
}
async function refreshCart(){
    const data = await getCart();
    //aggiundo il contentuto del carrello
    const tbody = document.querySelector('tbody');
    const finalPrice = document.querySelector('.cart-total');

    //aggiungo la risposta al tbody
    finalPrice.innerHTML = data.price
    tbody.innerHTML = data.content
}

async function getCart() {
    //prendo il sessid
    const sessid = sessionStorage.getItem('sessid');

    const response = await getRequest('http://'+URL+':'+PORT+'/api/get_cart/'+sessid);
    if (response.status == 'success') {
        return response
    }
    return null;
}

