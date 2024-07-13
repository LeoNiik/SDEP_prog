'use strict';
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const { Client } = require('pg');
var bodyParser = require('body-parser')
const { createHash } = require('crypto');
const utils = require('./utils');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');

const fs = require('fs');





//const result = createHash('sha256').update("bacon").digest('hex');
// Constants
const PORT = 80;
const HOST = '0.0.0.0';
const IP = 'ecommerce.web'; //just for testing
// DB connection
const client = new Client({
	user: 'postgres',
	password: process.env.DB_PASSWORD,
	host: '172.25.0.1',
	port: 5433,
	database: 'ecommerce',
});



client
.connect()
.then(() => {
	console.log('Connected to PostgreSQL database');
})
.catch((err) => {
	console.error('Error connecting to PostgreSQL database', err);
});
//setting search_path
client.query('SET search_path to ecom_schema');

const app = express();
const expressServer = app.listen(PORT, HOST);


app.use(express.static('upload'))
app.use(express.static('public'));
app.use(express.static('src'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	//X-Content-Type-Options: nosniff

	next();
});
// parse application/json
app.use(bodyParser.json())
app.use(fileUpload())

// ritorno l' utente dato il sessid
async function getUserBySessID(id) {
	const result = await client.query('SELECT * FROM Users WHERE session_id = $1', [id]);
	const user = result.rows[0];
	return user;
}

const transporter = nodemailer.createTransport({
	service: "Gmail",
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
	  user: process.env.EMAIL,
	  pass: process.env.EMAIL_PASS
	},
});

//send mail given the email and the message
const sendEmail = (to, subject, text) => {
	console.log(to);
	const mailOptions = {
	  from: process.env.EMAIL,
	  to: to,
	  subject: subject,
	  text: text,
	};
  
	transporter.sendMail(mailOptions, (error, info) => {
	  if (error) {
		return console.log('Error while sending email:', error);
	  }
	  console.log('Email sent:', info.response);
	});
};
  


async function generateUniqueID() {
	let id;
    let isUnique = false;

    while (!isUnique) {
        id = utils.generateRandomString(32);

        const res = await client.query('SELECT id FROM Users WHERE session_id = $1', [id]);
        if (res.rows.length === 0) {
            isUnique = true;
        }
	}
	return id;
}

app.post('/api/change_name/:id', async (req,res) => {
	const sessid = req.params.id;
	console.log('[DEBUG] /api/change_name::req.body - '+ req.body.name);
	const newname = req.body.name;
	try {
		const user = await getUserBySessID(sessid);
		if(!user){
			return res.status(401).send({status : "error"});
		}
		//checko se il nuovo nome contiene spazi
		if(newname.includes(' ')){
			return res.status(401).send({status : "success", content : 'Username cannot contain spaces'});
		}
		//checko se esiste gia' un utente con lo stesso nome
		const check = await client.query('SELECT * FROM Users WHERE username = $1', [newname]);
		if(check.rows.length != 0){
			return res.status(401).send({status : "success", content : "Username already taken"});
		}
		//cambio il nome dell' immagine profilo se esiste
		if(fs.existsSync(`upload/${user.username}.png`)){
			fs.rename(`upload/${user.username}.png`, `upload/${newname}.png`, function(err) {
				if ( err ) console.log('ERROR: ' + err);
			});
		}
		await client.query('UPDATE Users SET username = $1 WHERE id = $2', [newname, user.id]);
		return res.status(201).send({status : "success", content : 'Username Succesfully updated'});
	} catch (error) {
		console.error('Error during change name query: ', error);
	}
});

/* <div class="product">
<img src="product1.jpg" alt="Prodotto 1">
<h3>Nome Prodotto 1</h3>
<p>€99,99</p>
<button class="addtocart">Aggiungi al carrello</button>
<button>Dettagli</button>
</div> */
app.get('/api/products/:id', async (req,res) => {
	const {id} = req.params;
	const products = await client.query('SELECT * FROM Products');
	//ritorno solo i primi 10 prodotti
	products.rows = products.rows.slice(0,10);
	const user = await getUserBySessID(id);

	// console.log(products);
	let dynamicContent = '';
	for (const product of products.rows) {
		//prendo il nome del vendor
		const vendor_name = await client.query('SELECT username FROM Users WHERE id = $1', [product.vendor_id]);
		console.log(vendor_name.rows[0].username)

		if(!user.admin){
			dynamicContent += 
			`<div class="product">
				<img src="http://${IP}:8000/${vendor_name.rows[0].username}/${product.name}.png">
				<h3>${product.name}</h3>
				<p>€${product.price}</p>
				<p>${product.description}</p>
				<p>${product.category}</p>
				<p>${vendor_name.rows[0].username}</p>
				<div class="quantity-value">
					<button class="addtocart" id=${product.id}>Aggiungi al carrello</button>
					<input class='quantity' type="number" value="1" min="1" max="10" >    
				</div>
			</div>`;
		}
		else{
			dynamicContent += 
			`<div class="product">
				<img src="http://${IP}:8000/${vendor_name.rows[0].username}/${product.name}.png">
				<h3>${product.name}</h3>
				<p>€${product.price}</p>
				<p>${product.description}</p>
				<p>${product.category}</p>
				<p>${vendor_name.rows[0].username}</p>
				<button class="remove-product" id=${product.id}>Rimuovi</button>
			</div>`;
		}

	}
	


	return res.status(200).send({status : "success", content : dynamicContent});
});

app.post('/api/products/delete', async (req,res) => {
	const {product_id} = req.body;

	const result = await client.query('DELETE FROM Products WHERE id = $1', [product_id]);
	if (!result){
		return res.status(401).send({status : "error"});
	}
	return res.status(201).send({status : "success"});
});



app.post('/api/delete_item/' , async (req,res) => {
	const {sessid,product_id} = req.body
	const user = await getUserBySessID(sessid);

	if(!user){
		return res.status(401).send({status : "error"});
	}
	const result = await client.query('DELETE FROM Cart WHERE user_id = $1 AND product_id = $2', [user.id, product_id]);
	if (!result){
		return res.status(401).send({status : "error"});
	}
	return res.status(201).send({status : "success"});
});

// var fs = require('fs');
// var dir = './tmp/but/then/nested';

// if (!fs.existsSync(dir)){
//     fs.mkdirSync(dir, { recursive: true });
// }

app.post('/sell', async (req,res) => {
	const img = req.files.productImage;
	console.log(img);
	console.log(req.body);
	const { vendor_id, productName, productDescription, productCategory, productPrice, productStock } = req.body;
	
	
	if (!img) return res.sendStatus(400);
	const user = await getUserBySessID(vendor_id);
	console.log(user);
	//checko se l' utente esiste
	if(!user){
		return res.status(401).send({status : "error"});
	}
	//checko se i parametri hanno senso
	if (!productName || !productDescription || !productCategory || !productPrice || !productStock){
		return res.status(401).send({status : "error"});
	}
	
	//metto nel database il prodotto
	const result = await client.query('INSERT INTO Products (vendor_id, name, description, category, price, quantity) VALUES ($1,$2,$3,$4,$5,$6)', [user.id, productName, productDescription, productCategory, productPrice, productStock]);

	//checko se l' immagine e' gia' presente
	if(fs.existsSync(`upload/${user.username}/${img.name}`)){
		return res.status(200).send({status : "success", content : "Image already exists"});
	}
	// se non esiste gia' la salvo
	//rinomino l' immagine con il nome del prodotto
	img.name = productName + '.png';
	img.mv(__dirname + '/upload/' + user.username + '/' + img.name);
	return res.status(201).send({status : "success"});
});

app.get('/api/sold/:id', async  (req,res)=>{
	const id = req.params.id;
	console.log(id)
	const user = await getUserBySessID(id);
	console.log(user)
	if(!user){
		return res.status(201).send({status : 'error user'})
	}
	const result = client.query('SELECT * from orders WHERE vendor_id = $1', [user.id])
	if (!result.rows){
		return res.status(201).send({status : 'error', description : 'no sold yet'})
	}
	//respond dinamic content
	let dinamicContent = ''
	result.rows.forEach(order => {
		console.log(JSON.stringify(order));

		dinamicContent += 
		'\
		\
		\
		'
	}); 
	return res.status(200).send({
		status : 'success',
		content : dinamicContent
	})
})

app.get('/api/orders/:id', async  (req,res)=>{
	const id = req.params.id;
	console.log(id)

	const user = await getUserBySessID(id);
	if(!user){
		return res.status(201).send({status : 'error user'})
	}
	const result = client.query('SELECT * from orders WHERE user_id = $1', [user.id])
	if (!result.rows){
		return res.status(201).send({status : 'error', description : 'no orders yet'})
	}
	//respond dinamic content
	let dinamicContent = ''
	result.rows.forEach(order => {
		console.log(JSON.stringify(order));

		dinamicContent += 
		'\
		\
		\
		'
	}); 
	return res.status(200).send({
		status : 'success',
		content : dinamicContent
	})
	
})

app.get('/users', async (req,res) => {
	const users = await client.query('SELECT * FROM Users');

	let dynamicContent = '';
	for (const user of users.rows) {
		dynamicContent += 
		`<div>
			<h3>${user.username}</h3>
			<p>${user.email}</p>
			<p>${user.balance}</p>
			<button class="remove-user" id=${user.id}>Rimuovi</button>
		</div>`;
	}
	return res.status(200).send({status : "success", content : dynamicContent});

});

app.post('/users/delete', async (req,res) => {
	const {user_id} = req.body;

	const result = await client.query('DELETE FROM Users WHERE id = $1', [user_id]);
	if (!result){
		return res.status(401).send({status : "error"});
	}
	return res.status(201).send({status : "success"});
});


app.post('/api/add_balance' , async (req,res) => {
	const {id, amount} = req.body;
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error"});
	}
	if(!amount){
		return res.status(401).send({status : "error"});
	}
	const result = await client.query('UPDATE Users SET balance = balance + $1 WHERE id = $2', [amount, user.id]);
	if (!result){
		return res.status(401).send({status : "error"});
	}
	return res.status(201).send({status : "success"});
});

app.post('/api/add_to_cart' , async (req,res) => {
	const {id, product_id, quantity} = req.body;
	console.log(req.body)
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error"});
	}
	if(!product_id){
		return res.status(401).send({status : "error"});
	}
	//check if product_id is alalready in the cart
	const check = await client.query('SELECT * FROM Cart WHERE user_id = $1 AND product_id = $2', [user.id, product_id]);
	let result;
	if(check.rows.length === 0){
		result = await client.query('INSERT INTO Cart (user_id, product_id, quantity) VALUES ($1,$2,$3)', [user.id, product_id, quantity]);
	}
	else{
		result = await client.query('UPDATE Cart SET quantity = quantity + $1 WHERE cart.id = $2 AND product_id = $3 AND user_id = $4', [quantity, check.rows[0].id, product_id, user.id]);
	}
	if (!result){
		return res.status(401).send({status : "error"});
	}
	return res.status(201).send({
		status : "success",
		content :
				"<div class='cart-succ'>\
					<p>Aggiunto al carrello con successo</p>\
					<i class='fa fa-check-circle-o' aria-hidden='true'></i>\
				</div>"
	});
});



/* <tr>
<td>
	<div class="product-info">
		<img src="product1.jpg" alt="Prodotto 1">
		<div class="product-details">
			<h3>Nome Prodotto 1</h3>
			<p>Categoria: Esp32</p>
		</div>
	</div>
</td>
<td>€12,99</td>
<td>
	<input type="number" value="1" min="1">
</td>
<td>€12,99</td>
<td><button class="remove">Rimuovi</button></td>
</tr> */
 
//send index.html as response for GET /
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});
					
async function getUser(username){

	if (!username) {
		return null;
	}

	// Cerca l'utente nel database
	const result = await client.query('SELECT * FROM Users WHERE username = $1', [username]);
	const user = result.rows[0];

	// Verifica che l'utente esista
	return user;
}
	
function comparePasswd(passwd, hash){
	const hashedPassword = createHash('sha256').update(passwd).digest('hex');
	return hashedPassword === hash;
}

// Placeholder for POST /api/login route
app.post('/api/login', async (req, res) => {
	
	// Handle login logic here
	
	const { username, password} = req.body;
	try {

		let user = await getUser(username);
		console.log(user);
		if (!user) {
			return res.status(401).send({
				status : "User "+username+" does not exist"
			});
		}

		const isPasswordValid = comparePasswd(password, user.password);
		// Confronta la password inserita con quella salvata nel database
		if (!isPasswordValid) {
			return res.status(401).send({status : "wrong credentials"});
		}
		//checko se l'utente e' verificato
		if (!user.verified){
			return res.status(401).send({status : "User not verified, check your email"});
		}

		// Se le credenziali sono valide, autentica l'utente
		let sessionid = utils.generateRandomString(32);
		await client.query('UPDATE Users SET session_id = $1 WHERE username = $2', [sessionid, username]);

		//genera il sessid
		//aggiorna il sessid
		//console loggo
		console.log('Utente autenticato:');
		console.log('Sessid:', sessionid);
		return res.status(200).send({status : "success", sessid : sessionid});

		
	} catch (error) {
		console.error('Errore durante il login:', error);
		return res.status(500).send({status : "internal error"});
	}
});

app.post('/api/auth/sessid', async (req,res) => {
	const {sessid} = req.body;
	try {
		const user = await client.query('SELECT username FROM Users WHERE session_id = $1', [sessid]);
		if(user.rows.length === 0){
			return res.status(401).send({status : "User not found"});
		}
		return res.status(200).send({status : "success", username : user.rows[0].username});
		//res.sendFile(path.join(__dirname, 'public/home.html'));
	} catch (error) {
		console.log('Error during auth query')
	}

});



app.post('/api/reset', async (req,res) => {
	const {password,verify_token} = req.body;
	
	if (!password) {
		return res.status(401).send({
			status : "password "+password+" not valid"
		});
	}

	try {
		const user = await client.query('SELECT * FROM Users WHERE verify_token = $1', [verify_token]);
		if(user.rows.length === 0){
			return res.status(401).send({status : "session_id not found"});
		}
		// Hash della password
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		console.log(password,hashedPassword);
		//aggiorno la password
		await client.query('UPDATE Users SET password = $1 WHERE verify_token = $2', [hashedPassword, verify_token]);
		return res.status(200).send({status : "success"});
	
	} catch (error) {
		console.error('Errore durante il reset password:', error);
		return res.status(500).send({status : "internal error"});
	}
});


app.post('/api/forgot', async (req,res) => {
	const { email} = req.body;
	console.log(email);
	if (!email) {
		return res.status(401).send({
			status : "email "+email+" does not exist"
		});
	}
	try {
		//cerco l'email
		const user = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
		if(user.rows.length === 0){
			return res.status(401).send({status : "Email not found"});
		}
		//creo un link che li redirecta a reset_psw.html autehticando l'utente
		const link = 'http://' + IP + ':8000/reset_psw.html?token='+user.rows[0].verify_token;

		//invio email
		sendEmail(email, 'Reset your password', 'Hi Mr. ' + user.rows[0].username + '.\n\n\nTo reset your password click on the link: '+ link);
	
		return res.status(200).send({status : "success"});
	} catch (error) {
		console.error('Errore durante il reset password:', error);
		return res.status(500).send({status : "internal error"});
	}
});
// Placeholder for POST /signup route
app.post('/api/signup', async (req, res) => {
	
	const { username, password , email} = req.body;
	console.log(email);
	let user = await getUser(username);
	console.log(user);

	if(user){
		return res.status(401).send({status : 'User '+ username+' already exists'})
	}

	try {

		//checko se l' username contiene spazi
		if (username.includes(' ')){
			return res.status(401).send({status : "Username cannot contains spaces"});
		}

		let clicked = false;
		//crea un handler per il link

		//finche' non e' cliccato il link non continuare
		
		
		// Hash della password
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		console.log(password,hashedPassword)
		// Inserisci il nuovo utente nel database
		await client.query(
			'INSERT INTO Users (username, password, email) VALUES ($1,$2,$3)',
			[username,hashedPassword,email]
		);
			
		
		//generate default sessid
		const default_sessid = await generateUniqueID();
		const verify_token = await generateUniqueID();
		//aggiungi il sessid
		await client.query('UPDATE Users SET session_id = $1 WHERE username = $2', [default_sessid, username]);
		await client.query('UPDATE Users SET verify_token = $1 WHERE username = $2', [verify_token, username]);
		//const verify_token = await client.query('SELECT session_id FROM Users WHERE username = $1', [username]);
		
		const link = 'http://'+IP+':8000/verify?token='+default_sessid;
				//verify_token = session_id
				

		//invia email di verifica
		sendEmail(email, 'Verify your email', 'Hi,' + username + '. Click on the following link to verify your account '+ link);
		//creo una cartella con il nome dell' utente
		
		exec('mkdir upload/'+username, (err, stdout, stderr) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log(stdout);
		});
		return res.status(200).send({status : "success"});
		

	} catch (error) {
		console.error('Errore durante la registrazione:', error);
		return res.status(500).send({status : "internal error"});
	}	
});




app.post('/upload', async (req, res) => {
    const image  = req.files.image;
	const id = req.body.sessid;

	console.log(image);
	console.log(req.body.sessid);

    if (!image) return res.sendStatus(400);

    // If doesn't have image mime type prevent from uploading
    //if (!/^image/.test(image.mimetype)) return res.sendStatus(400);

	const user = await getUserBySessID(id);
	

	//rinomino l' immagine con il sessid dell' utente
	console.log("[DEBUG] /upload image: " + JSON.stringify(image.name));
	image.name = user.username + path.extname(image.name);
	//retrivo l'estensione dell' immagine
	//const ext = path.extname(image.name);
	//salvo l' immagine in locale 
    image.mv(__dirname + '/upload/' + user.username + '/' + image.name);


	//redirecto a home
	res.redirect('http://'+IP+':8000/home');


    res.sendStatus(200);
});

/* <tbody>
	<!-- Ripetere per ciascun prodotto nel carrello -->
	<tr>
		<td>
			<div class="product-info">
				<img src="product1.jpg" alt="Prodotto 1">
				<div class="product-details">
					<h3>Nome Prodotto 1</h3>
					<p>Categoria: Esp32</p>
				</div>
			</div>
		</td>
		<td>€12,99</td>
		<td>
			<input type="number" value="1" min="1">
		</td>
		<td>€12,99</td>
		<td><button class="remove">Rimuovi</button></td>
	</tr>
	<!-- Fine ripetizione -->
</tbody> */
app.get('/api/balance/:id', async (req,res)=>{
	const {id} = req.params;
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error user"});
	}
	return res.status(200).send({status : 'success', balance : `<h2>Your Balance: ${user.balance}€</h2>`, balance_int: user.balance});	
});

app.get('/api/get_profile/:id' , async (req,res) => {
	const {id} = req.params;
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error user"});
	}
	const dynamicContent = 
	'<div class="profile-card">\
		<div class="profile-info">\
			<h2>'+user.username+'</h2>\
			<p><strong>Email:</strong> '+user.email+'</p>\
		</div>\
		<div class "balance-info">\
			<p><strong>Saldo attuale:</strong> '+ user.balance +'</p>\
			<input type="number" id="amount" name="amount" placeholder="Inserisci l importo da aggiungere">\
			<button class="add-balance" onclick="addBalance()">Aggiungi Saldo</button>\
		</div>\
	</div>';

	return res.status(200).send({status : "success", content : dynamicContent});
});

app.get('/api/checkout/:id', async (req,res)=>{
	const {id} = req.params;
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error"});
	}
	const cart = await client.query('SELECT * FROM Cart WHERE user_id = $1', [user.id]);
	//ricalcolo il prezzo dei vari prodotti
	let finalPrice = 0;
	for (const product of cart.rows) {
		const product_info = await client.query('SELECT * FROM Products JOIN Users ON vendor_id=users.id WHERE products.id = $1', [product.product_id]);
		console.log("product_info.rows[0].price:  "+product_info.rows[0].price);
		console.log("product.quantity:  "+product.quantity);
		finalPrice += product_info.rows[0].price * product.quantity
	}
	console.log(finalPrice)
	if(user.balance < finalPrice){
		//do nothing
		return res.status(201).send({status : 'error', description : 'no money'})

	}
	
	//delete cart, insert orders with all the information
	for (const product of cart.rows) {
		let product_info = await client.query('SELECT * FROM Products JOIN Users ON vendor_id=users.id WHERE products.id = $1', [product.product_id]);
		product_info = product_info.rows[0]
		//decrease quantity of a product_info 
		//update user balance
		// nuovo balance
		// checko se sto ordinando piu' della quantita' del prodotto
		if(product.quantity > product_info.quantity){
			return res.status(201).send({status : 'error', description : 'quantity not available'})
		}
		let new_stock = product_info.quantity - product.quantity

		let descreaseStock = client.query('UPDATE Products SET quantity = $1 WHERE id = $2', [new_stock, product_info.id])
		// let order = client.query('INSERT INTO Orders (user_id, vendor_id, product_id, quantity, total) VALUES ($1,$2,$3,$4,$5) ', [user.id, product_info.vendor_id, product_info.id,product.quantity,finalPrice]) 
		let cartdelete = client.query('DELETE FROM cart WHERE cart.id = $1', [product.id])
	}
	console.log("USER BALANCE: "+user.balance);
	console.log("FINAL PRICE: "+finalPrice);
	let new_balance = user.balance - finalPrice;
	console.log("NEW BALANCE: "+new_balance);
	let updateBalance = client.query('UPDATE Users SET balance = $1 WHERE id = $2', [new_balance, user.id])


	return res.status(201).send({status : 'success'})
    // user_id INT REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
    // vendor_id INT REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
    // product_id INT REFERENCES Products(id) ON DELETE CASCADE NOT NULL,
    // quantity INT NOT NULL,
    // total DECIMAL(10, 2) NOT NULL,
});
app.get('/api/get_cart/:id' , async (req,res) => {
	const {id} = req.params;
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error"});
	}
	const cart = await client.query('SELECT * FROM Cart WHERE user_id = $1', [user.id]);
	let dynamicContent = '';
	let finalprice = 0;
	for (const product of cart.rows) {
		const product_info = await client.query('SELECT * FROM Products JOIN Users ON vendor_id=users.id WHERE products.id = $1', [product.product_id]);
		finalprice += product_info.rows[0].price * product.quantity
		dynamicContent += 
		`<tr class="product-cart">
			<td>
				<div class="product-info">
					<img src="http://${IP}:8000/${product_info.rows[0].username}/${product_info.rows[0].name}.png" alt="Prodotto 1">
					<div class="product-details">
						<h3>${product_info.rows[0].name}</h3>
						<p>Categoria: ${product_info.rows[0].category}</p>
					</div>
				</div>
			</td>
			<td>€${product_info.rows[0].price}</td>
			<td>${product.quantity}</td>
			<td>€${product_info.rows[0].price * product.quantity}</td>
			<td><button class="remove-item-btn" id=${product.product_id} >Rimuovi</button></td>
		</tr>`;
	}
	finalprice =
				`<h2>Totale Carrello: ${finalprice}€</h2>
				<button class="checkout">Procedi al Pagamento</button>`

	return res.status(200).send({status : "success", content : dynamicContent, price : finalprice});
});




app.get('/profile/:id' , async (req,res) => {
	const {id} = req.params;
	const user = await getUserBySessID(id);

	let image_src = `https://via.placeholder.com/40`;

	//checko se esiste un'immagine con il nome dell'utente
	if(fs.existsSync(`upload/${user.username}.png`)){
		image_src = `http://${IP}:8000/upload/${user.username}.png`;
	}

	return res.status(200).send({
		status : "success",
		content : user,
		image : image_src
	});

});



app.get('/verify', async (req,res) => {
	const token = req.query.token;
	// console.log(token);
	//verifica se in Users c'e' un sessid = token
	
	//prendi utente con sessid = token
	const user = await getUserBySessID(token);
	//se sessid esiste
	if (user.session_id){
		//set VERIFIED to true
		const result = await client.query('UPDATE Users SET verified = true WHERE session_id = $1', [token]);
		console.log(result);
		if (result){
			return res.status(200).send({status : "success"});
		}

	}
	else{
		return res.status(401).send({status : "error"});
	}
});

app.get('/admin_panel/:id' , async (req,res) => {
	const {id} = req.params;
	const user = await getUserBySessID(id);
	if(!user){
		return res.status(401).send({status : "error"});
	}
	//checko se l' utente e' admin
	if(user.admin){

		res.redirect(`/admin/${id}/from_admin_panel`);
	}
	else{
		res.redirect('/no_auth');
	}
});

app.get('/admin/:id/from_admin_panel' ,async (req,res) => {
	const {id} = req.params;

	console.log(req.headers.referer);
  
	// if (req.headers.referer === `http://${IP}:${PORT}/admin_panel/${id}`){
	res.sendFile(path.join(__dirname, 'public/admin_panel.html'));
	// } else {
	//   	res.sendFile(path.join(__dirname, 'public/no_auth.html'));
	// }

});

app.get('/login', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/login.html'))
});

app.get('/index', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'))
});

app.get('/forgot', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/forgot.html'))
});

app.get('/signup', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/signup.html'))
});
app.get('/profile', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/profile.html'))
});

app.get('/sell', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/sell.html'))
});
app.get('/cart', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/cart.html'))
});
app.get('/products', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/product.html'))
});


app.get('/easter_egg', (req,res) => {
	res.redirect('https://www.youtube.com/watch?v=2HKbbDukbJE&list=RD2HKbbDukbJE');
});

app.get('/upload/:name', (req,res) => {
	const {name} = req.params;
	res.sendFile(path.join(__dirname, 'upload/'+name));
});
app.get('/no_auth', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/no_auth.html'));
});

app.get('/home', (req,res) => {
	//se la richiesta arriva da /api/auth/sessid  o /login accetta, altrimenti redirecta in no_auth
	if (req.headers.referer === 'http://' + IP + ':8000/api/auth/sessid'){
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else if (req.headers.referer === 'http://' + IP + ':8000/login'){
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else if (req.headers.referer === 'http://' + IP + ':8000/home'){
		//redirecto a http://' + IP + ':8000/api/auth/sessid
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else{
		res.redirect('http://' + IP + ':8000/login');
	}
});



