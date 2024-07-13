document.addEventListener('DOMContentLoaded', async (event) => {
    assignEventListeners();
    RefreshProducts();
}); 
const URL = 'ecommerce.web';
const PORT = '8000'

const sleep = ms => new Promise(r => setTimeout(r, ms));

function assignEventListeners(){
    addToCartListeners();
    adminPanelListener();
    logoutListener();
    categoryListener();

}
function addToCartListeners(){
    let productsOpt = document.querySelectorAll('.quantity-value')
    productsOpt.forEach((product)=>{
        let button = product.querySelector('.addtocart');
        let quantity = product.querySelector('.quantity');
        button.addEventListener('click', async (event)=> {
            product_id = event.target.id;
            console.log('clicked addtocart');
            const id = sessionStorage.getItem('sessid');
            let sendData = {
                id : id,
                product_id : product_id,
                quantity : quantity.value
            } 
            console.log(sendData);
            const resData = await postRequest(`http://${URL}:${PORT}/api/add_to_cart`, sendData);
            flashPopup(resData.content);
        });
    
    });
}

function logoutListener(){

    let logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', ()=>{
        //tolgo remember me
        sessionStorage.removeItem('remember_me');
        //redirecto a login
        window.location.href = '/login';
    });

    
};



function adminPanelListener(){
    //handle al bottone con id admin-panel
    let adminPanel = document.getElementById('admin-panel');
    adminPanel.addEventListener('click', async ()=>{
        console.log('clicked admin panel');
        const sessid = sessionStorage.getItem('sessid');
        if(!sessid) return;
        const options = {
            method: 'GET',
            headers: {
            'Content-Type': 'application/text'
            }
        };
        //fai una richista al backend per aprire la pagina admin
        //  
        const response = await fetch(`http://${URL}:${PORT}/admin_panel/${sessid}`, options);
        if (response.redirected) {
            // Naviga alla nuova URL
            window.location.href = response.url;
          } else {
            console.log(response);
          }
        console.log(response);
    });
}


async function RefreshProducts(){
    let productsData = await getProducts();
    let productsDiv = document.getElementById('products');
    productsDiv.innerHTML = productsData;
    addToCartListeners();
}

    function flashPopup(content) {
        const modal = document.getElementById('popup-flash');
        let flashcontent = modal.querySelector('.modal-content');

        // Modifica il contenuto del popup
        flashcontent.innerHTML = content;
        // Imposta la visibilità del popup
        modal.style.zIndex = 15;
        
        console.log(content, modal);

        // Usa setTimeout per nascondere il popup dopo 2 secondi
        setTimeout(() => {
            modal.style.zIndex = -1;
            // Pulisci il contenuto del popup se necessario
            flashcontent.innerHTML = '';
        }, 2000);
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

async function getProducts() {
    const sessid = sessionStorage.getItem('sessid');

    let data = await getRequest(`http://${URL}:${PORT}/api/products/${sessid}`);
    if(!data.content) return null;
    return data.content
}

// metti un listener sulle categorie
// quando clicchi su una categoria fai una richiesta al backend
// che ti restituisce i prodotti di quella categoria
// e poi li stampi

async function getProductsByCategory(category){
    const sessid = sessionStorage.getItem('sessid');
    let data = await getRequest(`http://${URL}:${PORT}/api/products/${sessid}/category/${category}`);
    if(!data.content) return null;
    return data.content
};


function categoryListener(){
    const categories = document.querySelectorAll('.category-name');

    categories.forEach(category => {
        category.addEventListener('click', async (event) => {
            const categoryName = event.target.getAttribute('data-category');
            // Stampa il nome della categoria cliccata nella console
            console.log(`Categoria cliccata: ${categoryName}`);
            let resData = null;
            if (categoryName === 'tutti') {
                resData = await getProducts();
            } else {
                resData = await getProductsByCategory(categoryName);
            }
            let dynamicContent = '';
            dynamicContent += resData;
            // check if resData is null
            if (!resData) {
                dynamicContent = '<p><b>Nessuno prodotto di questa categoria</b></p>';
                console.log('Errore nella richiesta dei prodotti per categoria');
                // return;
            }

            let productsDiv = document.getElementById('products');
            productsDiv.innerHTML = dynamicContent;

            // flashPopup(resData.content);
        });
    });
}





function logout() {
    //chiedi al backend di generare un nuovo sessid
    
    sessionStorage.removeItem('sessid');
    sessionStorage.removeItem('remember_me');
    window.location.href = '/login';
}


