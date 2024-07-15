
// esegui ogni volta che carici la pagina
document.addEventListener('DOMContentLoaded', async (event) => {
    // aggiungi gli utenti alla pagina
    await getUsers();
    // aggiungi i prodotti alla pagina
    await getProducts();
    // assegna gli event listeners (listener per bottoni)
    assignEventListeners();

}); 


const URL = 'ecommerce.web';
const PORT = '8000'

// macro per sleepare
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

// funzione per assegnare gli event listeners dei vari bottoni
function assignEventListeners(){
    deleteProductListener();
    deleteUsersListener();
    logoutListener();
}

// refresha la pagina
async function refresh(){
    await getUsers();
    await getProducts();
    assignEventListeners();
};

// listener per il bottone di logout
function logoutListener(){

    let logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', ()=>{
        //tolgo remember me
        sessionStorage.removeItem('remember_me');
        //redirecto a login
        window.location.href = '/login';
    });

    
};

// listener per il bottone di delete dei prodotti
function deleteProductListener(){
    const deleteButtons = document.querySelectorAll('.remove-product');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            // prendo l'id del bottone cliccato e faccio una richiesta al server con il mio sessid e il product_id
            console.log('delete product clicked');
            const product_id = event.target.id
            const body = {product_id};
            const sessid = sessionStorage.getItem('sessid');
            const resData = await postRequest(`http://${URL}:${PORT}/api/products/delete/${sessid}`, body);
            console.log(resData);

            // printo il risultato sotto forma di alert
            alert(resData.content);
            
            // sleepa 2 secondi
            // await sleep(2000);
            // await refresh();

            //refresh
            return;
        });
    });
}

// listener per il bottone di delete degli utenti
function deleteUsersListener(){
    const deleteButtons = document.querySelectorAll('.remove-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            // prendo l'id del bottone cliccato e faccio una richiesta al server con il mio sessid e il user_id che voglio cancellare
            console.log('delete user clicked')
            const user_id = button.getAttribute('id');
            const body = {user_id};
            const sessid = sessionStorage.getItem('sessid');

            const resData = await postRequest(`http://${URL}:${PORT}/users/delete/${sessid}`, body);
            console.log(resData);
            // printo il risultato sotto forma di alert
            alert(resData.content);

            // sleepa 2 secondi
            // await sleep(2000);
            // await refresh();

            //refresh
            return;
        });
    });
}


// funzione per prendere gli utenti dal server e aggiungerli alla pagina html
async function getUsers(){
    const sessid = sessionStorage.getItem('sessid');
    const resData = await getRequest(`http://${URL}:${PORT}/users/${sessid}`);
    //aggiungo resData.content alla classe users
    console.log(resData)
    const users = document.querySelector('.users');
    users.innerHTML = resData.content;
    return;
}

// funzione per prendere i prodotti dal server e aggiungerli alla pagina html
async function getProducts() {

    const sessid = sessionStorage.getItem('sessid');
    let data = await getRequest(`http://${URL}:${PORT}/api/products/${sessid}`);
    if(!data.content) return null;
    //aggiungo data.content alla classe products
    console.log(data)
    const products = document.querySelector('.products');
    products.innerHTML = data.content;
}
