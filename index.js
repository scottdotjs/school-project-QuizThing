const bodyParser = require('body-parser');
const express = require('express');
const fetch = require('node-fetch');

const app = express();

const storage = {
	score : 0
};

app.use(bodyParser.json());
app.set('view engine', 'hbs');

app.use('/assets', express.static('assets'));

var hbs = require('hbs');
hbs.registerPartials(__dirname + '/views/partials');

// Are you kidding me with this
hbs.registerHelper( 'concat', (...args) => {
	return args.slice(0, -1).join('');
});

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/currentQuestion', (req, res) => {
	fetchStoredQuestion(req, res);
});

app.get('/newQuestion', (req, res) => {
	fetchNewQuestion(req, res);
});

app.post('/checkAnswer', (req, res) => {
	checkAnswer(req, res);
});

// ---------------------------------------------------------------------------

function mergeAnswers (input) {
	let data = input[0];
	let incorrect = data.incorrect_answers;
	let correct = data.correct_answer;

	return shuffle([...incorrect, correct]);
}

// https://stackoverflow.com/a/12646864/3358139
function shuffle (array) {
		for (let i = array.length - 1; i > 0; i--) {
				let j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
}

function fetchStoredQuestion (req, res) {
	if (storage.question) {
		res.json({
			difficulty : storage.difficulty,
			question : storage.question,
			score : storage.score,
			answers : storage.answers,
			triesAllowed : storage.triesAllowed
		});
	} else {
		fetchNewQuestion(req, res);
	};
}

function fetchNewQuestion (req, res) {
	let difficulty = undefined, category = undefined;

	if (!storage.difficulty) storage.difficulty = 'easy';
	difficulty = storage.difficulty;

	if (!storage.category) storage.category = 18;
	category = storage.category;

	let fetchUrl = `https://opentdb.com/api.php?amount=1&category=${category}&difficulty=${difficulty}`;

	fetch(fetchUrl)
		.then(response => {
			return response.json();
		})
		.then(json => {
			let answers = mergeAnswers(json.results);
			storage.question = json.results[0].question;
			storage.answers = answers;
			storage.correctAnswer = json.results[0].correct_answer;
			score = storage.score;

			res.json({
				difficulty : difficulty,
				question : json.results[0].question,
				score : score,
				answers : answers,
				triesAllowed : json.results.length - 1
			});
		})
		.catch(error => {
			res.status(500).json(
				{ error: `Couldn't get questions: ${fetchUrl}` }
			);
		});
}

function checkAnswer (req, res) {
	let correct = 0;

	// To do: bump difficulty at 10, 20
	if (req.body.check === storage.correctAnswer) {
		correct = 1;
		storage.score++;
	}

	res.json({ 'correct' : correct });
}

// --------------------------------------------------------------------------

app.listen(8080, function () {
	console.log('Starting Express server on port 8080.');
});