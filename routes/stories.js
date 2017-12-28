const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Story = mongoose.model('stories');
const User = mongoose.model('users');
const {ensureAuthenticated, ensureGuest} = require('../helpers/auth');

// Stories Index
router.get('/', (req, res) => {
	Story.find({status: 'public'})
		.populate('user')
		.then(stories => {
			res.render('stories/index' , {
				stories: stories
			})
		})
})

//Show Single Story
router.get('/show/:id', (req, res) => {
	Story.findOne({
		_id: req.params.id
	})
	.populate('user')
	.sort({date: 'desc'})
	.populate('comments.commentUser')
	.then(story => {
		if(story.status == 'public') {
			res.render('stories/show', {
			story: story
		})
		} else {
			if(req.user) {
				if(req.user.id == story.user._id) {
					res.render('stories/show', {
					story: story
					})
				} else {
					res.redirect('/stories');
				}
			} else {
				res.redirect('/stories');
			}
		}
	})
})

//list storries from the user
router.get('/user/:userId', (req, res) => {
	Story.find({user: req.params.userId, status: 'public'})
	.populate('user')
	.then(story => {
		res.render('stories/index', {
			stories: stories
		})
	})
})

//Logged in users stories
router.get('/my', ensureAuthenticated,(req, res) => {
	Story.find({user: req.user.id})
	.populate('user')
	.then(story => {
		res.render('stories/index', {
			stories: stories
		})
	})
})

// Add Story Form
router.get('/add', ensureAuthenticated ,(req, res) => {
	res.render('stories/add');
})

// Edit Story Form
router.get('/edit/:id', ensureAuthenticated ,(req, res) => {
	Story.findOne({
		_id: req.params.id
	})
	.then(story => {
		if(story.user != req.user.id) {
			req.flash('error_msg', 'Not Authorized!');
			res.redirect('/stories');
		} else {
			res.render('stories/edit' , {
			story:story
		})
		}
		
	})
})

//Process Add Story
router.post('/', (req, res) => {
	let allowComments;
	let errors = [];

	if(!req.body.title) {
		errors.push({text: 'Please Tittle'})
	}
	if(!req.body.body) {
		errors.push({text: 'Your Story is empty ;('})
	}

	if(req.body.allowComments) {
		allowComments = true;
	} else {
		allowComments = false;
	}

	if(errors.length > 0) {
		res.render('stories/add', {
			errors: errors,
			title: req.body.title,
			body: req.body.body,
		})
	} else {
		const newStory = {
				title: req.body.title,
				body: req.body.body,
				status: req.body.status,
				allowComments: allowComments,
				user: req.user.id
			}
	
	// Create our Story
	new Story(newStory)
	.save()
	.then(story => {
		req.flash('success_msg', 'Idea Added!');
		res.redirect(`/stories/show/${story.id}`)
		})
	}
})

// Edit form process
router.put('/:id', (req, res) => {
	Story.findOne({
		_id: req.params.id
	})
	.then(story => {
		let allowComments;

		if(req.body.allowComments) {
			allowComments = true;
		} else {
			allowComments = false;
		}
		// New values
		story.title = req.body.title;
		story.body = req.body.body;
		story.status = req.body.status;
		story.allowComments = allowComments;

		story.save()
			.then(story => {
				req.flash('success_msg', 'Idea updated!');
				res.redirect('/dashboard');
			})
	})
})

//Delete Story
router.delete('/:id', (req, res) => {
	Story.remove({
		_id: req.params.id
	})
	.then(() => {
		req.flash('success_msg', 'Idea Removed!');
		res.redirect('/dashboard');
	})
});

//Add comment
router.post('/comment/:id' , (req , res) => {
	Story.findOne({
		_id: req.params.id
	})
	.then(story => {
		const newComment = {
			commentBody: req.body.commentBody,
			commentUser: req.user.id
		}

		//Push to comments array
		story.comments.unshift(newComment);

		story.save()
		.then(story => {
			res.redirect(`/stories/show/${story.id}`)
		})
	});
})

router.delete('/comment/:id', (req, res) => {
	Story.remove({
		_id: req.body.id.comments
	})
	.then(() => {
		req.flash('success_msg', 'Comments Removed!');
		res.redirect('/dashboard');
	})
});


module.exports = router;





