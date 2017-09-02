// no cc desync
module.exports = function skillPredictionFix(dispatch) {
	
	// constants
	const CC = require('CC.js')
	
	// variables
	let cid,
		model,
		race,
		job,
		specialCC,
		myCC = []
	
	// get cid
	dispatch.hook('S_LOGIN', 1, event => {
		cid = event.cid
		model = event.model
		race = Math.floor((model - 10101) / 100)
		job = (model - 10101) % 100
	})
	
	// get abnormality
	dispatch.hook('S_ABNORMALITY_BEGIN', 2, event => {
		// if character is your character
		if (event.target.equals(cid)) {
			// if debuff is CC
			if (CC.includes(event.id) {
				// add to list of active CC
				myCC.push(event.id)
			}
		}
	})

	// get abnormality end
	dispatch.hook('S_ABNORMALITY_END', 1, event => {
		// if character is your character
		if (event.target.equals(cid)) {
			// if debuff is CC
			if (CC.includes(event.id)) {
				// remove from list of active CC
				myCC.splice(myCC.indexOf(event.id), 1)
			}
		}
	})

	// get stagger/KD/push
	dispatch.hook('S_EACH_SKILL_RESULT', 3, event => {
		// if character is your character
		if (event.target.equals(cid)) {
			// if KD, stagger, push-back, etc and not self-inflicted
			if (setTargetAction != 0 && !event.source.equals(cid)) {
				// prevent fake skills
				specialCC = true
				// set location
				// S_EACH_SKILL_RESULT
				// return false
			}
		}
	})

	// detect fake skills
	dispatch.hook('S_ACTION_STAGE', 1, {fake: true}, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			// if CC'd or displaced
			if (CC.includes(myCC[0]) || specialCC) {
				// prevent fake skills
				return false
			}
		}
	})
	
	/*
	// detect real skills
	dispatch.hook('S_ACTION_STAGE', 1, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			// if CC'd or displaced
			if (CC.includes(myCC[0] || specialCC) {
				// allow real skills
				return true
			}
		}
	})
	*/
	
	// detect real action end
	dispatch.hook('S_ACTION_END', 1, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			// if displaced
			if (specialCC) {
				// allow fake skills
				specialCC = false
			}
		}
	})
}
