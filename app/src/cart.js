
const URL = 'ecommerce.web';
const PORT = '8000'

// esegui quando il documento viene caricato
document.addEventListener('DOMContentLoaded', async (event) => {
    // refresha il carrello e mostra il contenuto
    await refreshAll();
    // aggiungi i listener ai bottoni
    removeItemListeners();
    checkOutCartListener();
}); 

// funzione per refreshare il carrello e il saldo
async function refreshAll(){
    await refreshCart();
    await refreshBalance();
}

// funzione per aggiungere i listener ai bottoni per rimuovere oggetti dal carrello
function removeItemListeners(){
    let products = document.querySelectorAll(".product-cart")
    products.forEach((product)=>{
        // prendo id del prodotto
        let button = product.querySelector('.remove-item-btn')
        product_id = button.id
        button.addEventListener('click', (event)=>{
            console.log('clicckato')
            
            // chiamo la funzione deleteItem
            deleteItem(product_id);
        });
    });
}

// funzione per aggiungere il listener al bottone di checkout
function checkOutCartListener(){
    let button = document.querySelector('.checkout');
    button.addEventListener('click', async (event)=>{

        console.log('clicckato')
        // chiamo la funzione checkOutCart
        await checkOutCart();
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
    // faccio la richiesta al server per rimuovere il prodotto mandando il sessid e l'id del prodotto
    const response = await postRequest('http://'+URL+':'+PORT+'/api/delete_item/',data);

    console.log('[DEBUG] deleteItem response:', response)
    //aggiorno il carrello
    await refreshAll();
    return response;
}


// funzione per fare il checkout del carrello
async function checkOutCart(){
    const id = sessionStorage.getItem('sessid');
    // faccio na richiesta al server per fare il checkout, gli passo solo il sessid
    let data = getRequest(`http://${URL}:${PORT}/api/checkout/${id}`);
    if(data.status === 'success'){
        console.log(data);
    }
    // prendo tutti gli id degli elementi del carrello
    // chiamo la funzione deleteItem per ogni id

    let ids = document.querySelectorAll('.remove-item-btn');
    console.log(ids)
    ids.forEach(async (id)=>{
        // prendo l'id
        id = id.id;

        console.log("button ID: ", id)

        await deleteItem(id)
    });

};
// funzione per refreshare il saldo
async function refreshBalance(){
    const balance = await getBalance()
    console.log(balance,'fefwefewfw')
    balanceDiv = document.getElementById('user-balance');
    balanceDiv.innerHTML = balance
}
// funzione per prendere il saldo
async function getBalance(){
    const id = sessionStorage.getItem('sessid');
    // faccio una richiesta GET al server per prendere il saldo passando il sessid nell' url 
    let data = await getRequest(`http://${URL}:${PORT}/api/balance/${id}`);
    console.log(data);
    return data.balance
}

// funzione per refreshare il carrello
async function refreshCart(){
    const data = await getCart();
    //aggiundo il contentuto del carrello
    const tbody = document.querySelector('tbody');
    const finalPrice = document.querySelector('.cart-total');

    //aggiungo la risposta al tbody
    finalPrice.innerHTML = data.price
    tbody.innerHTML = data.content
}

// funzione per prendere il contenuto del carrello
async function getCart() {
    //prendo il sessid
    const sessid = sessionStorage.getItem('sessid');

    // faccio una richiesta GET al server per prendere il carrello passando il sessid nell' url
    const response = await getRequest('http://'+URL+':'+PORT+'/api/get_cart/'+sessid);
    if (response.status == 'success') {
        return response
    }
    return null;
}

