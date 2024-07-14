document.addEventListener('DOMContentLoaded', async (event) => {
    await getUsers();
    await getProducts();
    assignEventListeners();

}); 


const URL = 'ecommerce.web';
const PORT = '8000'

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


function assignEventListeners(){
    deleteProductListener();
    deleteUsersListener();
    logoutListener();
}


async function refresh(){
    await getUsers();
    await getProducts();
    assignEventListeners();
};

function logoutListener(){

    let logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', ()=>{
        //tolgo remember me
        sessionStorage.removeItem('remember_me');
        //redirecto a login
        window.location.href = '/login';
    });

    
};

function deleteProductListener(){
    const deleteButtons = document.querySelectorAll('.remove-product');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {

            console.log('delete product clicked');
            const product_id = event.target.id
            const body = {product_id};
            const sessid = sessionStorage.getItem('sessid');
            const resData = await postRequest(`http://${URL}:${PORT}/api/products/delete/${sessid}`, body);
            console.log(resData);

            alert(resData.content);
            
            // sleepa 2 secondi
            await sleep(2000);
            // await refresh();

            //refresh
            return;
        });
    });
}

function deleteUsersListener(){
    const deleteButtons = document.querySelectorAll('.remove-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            console.log('delete user clicked')
            const user_id = button.getAttribute('id');
            const body = {user_id};
            const sessid = sessionStorage.getItem('sessid');

            const resData = await postRequest(`http://${URL}:${PORT}/users/delete/${sessid}`, body);
            console.log(resData);
            alert(resData.content);

            // sleepa 2 secondi
            await sleep(2000);
            // await refresh();

            //refresh
            return;
        });
    });
}


async function getUsers(){
    const resData = await getRequest(`http://${URL}:${PORT}/users`);
    //aggiungo resData.content alla classe users
    console.log(resData)
    const users = document.querySelector('.users');
    users.innerHTML = resData.content;
    return;
}

async function getProducts() {

    const sessid = sessionStorage.getItem('sessid');
    let data = await getRequest(`http://${URL}:${PORT}/api/products/${sessid}`);
    if(!data.content) return null;
    //aggiungo data.content alla classe products
    console.log(data)
    const products = document.querySelector('.products');
    products.innerHTML = data.content;
}




//l' admin deve poter rimuovere utenti e rimuovere inserzioni

