const express = require('express'),
	bodyParser = require('body-parser'),

	app = express();

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/static'));

require("./routes")(app)

app.get("*", (req, res) => {
	res.render("404");
})

const port = 3457;
const server = app.listen(3457)
console.log(`listening on port ${ port }`)
