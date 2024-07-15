function extractTime(dateString) {
    // Parse the date string into a Date object
    const date = new Date(dateString);

    // Extract hours, minutes, and seconds
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Return the time as a string in HH:MM:SS format
    return `${hours}:${minutes}`;
}

//genera una stringa di 32 caratteri alfanumerici, utilizzata per generare un token di accesso (il sessid)
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
}

module.exports = {extractTime,generateRandomString};