const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

//Load Models
require('./models/User');
require('./models/Story');

//Passport Config
require('./config/passport')(passport);

// Load routes
const auth = require('./routes/auth')
const index = require('./routes/index')
const stories = require('./routes/stories')

// Load keys
const keys = require('./config/keys')

// Handlebars helpers
	const { truncate, stripTags } = require('./helpers/hbs')

//Map global Promises
mongoose.Promise = global.Promise;
// Mongoose.connect
mongoose.connect(keys.mongoURI, {
	useMongoClient: true
})
	.then(() => console.log('MongoDB Connected'))
	.catch(err => console.log(err));

const app = express();

//Body-Parser MiddleWare
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());


// Handlebars Middleware
app.engine('handlebars', exphbs({
	helpers: {
		truncate: truncate,
		stripTags: stripTags 
	},
	defaultLayout: 'main'
}))
app.set('view engine', 'handlebars');

app.use(cookieParser());
app.use(session ({
	secret: 'secret',
	resave: false,
	saveUninitialized: false
}))

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Set Global Vars
app.use((req, res, next) => {
	res.locals.user = req.user || null;
	next();
})

//Set static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Use Routes
app.use('/auth', auth)
app.use('/', index)
app.use('/stories', stories)



const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`Port ${port} is Running!`)
})