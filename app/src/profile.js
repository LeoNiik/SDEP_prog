
document.addEventListener('DOMContentLoaded', async (event) => {
    await refreshProfile();
    console.log('loaded');
}); 

const URL = 'ecommerce.web';
const PORT = '8000'

async function getProfile(){
    //prendo nome e balance
    const id = sessionStorage.getItem('sessid');
    const profile_info = await getRequest(`http://${URL}:${PORT}/api/get_profile/${id}`);
    if (profile_info.status === 'success') {
        return profile_info.content
    }
    const data = null;
    console.log(profile_info)
    return data
    
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

        return data;
    } catch (error) {
        console.log('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}


async function getOrders(){
    const id = sessionStorage.getItem('sessid');
    const profile_info = await getRequest(`http://${URL}:${PORT}/api/orders/${id}`);
    console.log('ORDERS:: profile_info - ', profile_info)
    if (profile_info.status === 'success') {
        return profile_info.content
    }
    return null
}

async function getSold(){
    const id = sessionStorage.getItem('sessid');
    const soldorders = await getRequest(`http://${URL}:${PORT}/api/sold/${id}`);
    console.log('SOLD:: soldorders - ', soldorders)
    if (soldorders.status === 'success') {
        return soldorders.content
    }
    return null
}

async function refreshProfile(){
    console.log('ahdah')
    const profile_info = await getProfile();
    // const orders = await getOrders();
    const sold = await getSold();
    const balance = profile_info.balance_int;
    
    const profileDiv = document.querySelector('.profile');
    const soldDiv = document.getElementById('sold')
    const ordersDiv = document.getElementById('orders')
    
    ordersDiv.innerHTML = orders
    soldDiv.innerHTML = sold
    profileDiv.innerHTML = profile_info;
}




async function addBalance(){
    const id = sessionStorage.getItem('sessid');

    const balance = await getRequest(`http://${URL}:${PORT}/api/balance/${id}`).balance_int;
    let sendData = {
        id : id,
        amount : document.getElementById('amount').value
    }
    const resData = await postRequest(`http://${URL}:${PORT}/api/add_balance`, sendData);
    // flashPopup(resData.content)
    refreshProfile();
}

