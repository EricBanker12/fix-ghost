// no more cc desync
module.exports = function fixGhost(dispatch) {
	
	// constants
	const CC = require('./CC.js'),
		debug = false // if (debug) {console.log('')}
	
	// variables
	let cid,
		specialCC = false,
		myCC = [],
		fakeSkill,
		inFakeSkill = false,
		newCCTime = 0
	
	// get cid
	dispatch.hook('S_LOGIN', 1, event => {
		cid = event.cid
	})
	
	// get abnormality
	dispatch.hook('S_ABNORMALITY_BEGIN', 2, {order: 100, filter: {fake: null}}, event => {
		// if character is your character
		if (event.target.equals(cid)) {
			if (debug) {console.log('S_ABNORMALITY_BEGIN')}
			// if debuff is CC
			if (CC.includes(event.id)) {
				if (debug) {console.log('CC')}
				// add to list of active CC
				myCC.push(event.id)
				// set time of CC
				newCCTime = Date.now()
			}
		}
	})

	// get abnormality end
	dispatch.hook('S_ABNORMALITY_END', 1, {order: 100, filter: {fake: null}}, event => {
		// if character is your character
		if (event.target.equals(cid)) {
			if (debug) {console.log('S_ABNORMALITY_END')}
			// if debuff is CC
			if (CC.includes(event.id)) {
				if (debug) {console.log('CC')}
				// remove from list of active CC
				myCC.splice(myCC.indexOf(event.id), 1)
			}
		}
	})

	// get stagger/KD/push
	dispatch.hook('S_EACH_SKILL_RESULT', 3, {order: 100, filter: {silenced: null}}, event => {
		// if character is your character
		if (event.target.equals(cid)) {
			if (debug) {console.log('S_EACH_SKILL_RESULT real')}
			// if KD, stagger, push-back, etc and not self-inflicted
			if (event.setTargetAction != 0 && !event.source.equals(cid)) {
				if (debug) {console.log('CC')}
				// prevent fake skills
				specialCC = true
				if (debug) {console.log('specialCC', specialCC)}
				// if in fake skill
				if (inFakeSkill) {
					// end fake skill
					dispatch.toClient('S_ACTION_END', 1, {
						source: fakeSkill.source,
						x: fakeSkill.x,
						y: fakeSkill.y,
						z: fakeSkill.z,
						w: fakeSkill.w,
						model: fakeSkill.model,
						skill: fakeSkill.skill,
						type: 0,
						id: fakeSkill.id
					})
					// teleport to CC location
					/*
					dispatch.toClient('S_INSTANT_MOVE', 1, {
						id: cid,
						x: event.targetX,
						y: event.targetY,
						z: event.targetZ,
						w: event.targetW
					})
					*/
				}
			}
		}
	})

	// detect fake skills
	dispatch.hook('S_ACTION_STAGE', 1, {order: 100, filter: {fake: true}}, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			if (debug) {console.log('S_ACTION_STAGE fake')}
			fakeSkill = event
			inFakeSkill = true
			if (debug) {console.log('inFakeSkill', inFakeSkill)}
			// if CC'd or displaced
			if (CC.includes(myCC[0]) || specialCC) {
				// prevent fake skills
				return false
			}
		}
	})
	
	// detect real skills
	dispatch.hook('S_ACTION_STAGE', 1, {order: 100, filter: {silenced: null}}, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			if (debug) {console.log('S_ACTION_STAGE real')}
			// if CC'd or displaced
			if (CC.includes(myCC[0]) || specialCC) {
				if (debug) {console.log('CC')}
				// if CC'd within 10ms
				if ((Date.now() - newCCTime) < 10) {
					// if in fake skill
					if (inFakeSkill) {
						// end fake skill
						dispatch.toClient('S_ACTION_END', 1, {
							source: fakeSkill.source,
							x: fakeSkill.x,
							y: fakeSkill.y,
							z: fakeSkill.z,
							w: fakeSkill.w,
							model: fakeSkill.model,
							skill: fakeSkill.skill,
							type: 0,
							id: fakeSkill.id
						})
						// teleport to CC location
						/*
						dispatch.toClient('S_INSTANT_MOVE', 1, {
							id: cid,
							x: event.x,
							y: event.y,
							z: event.z,
							w: event.w
						})
						*/
					}
				}
				// allow real skills
				return true
			}
		}
	})
	
	// detect fake action end
	dispatch.hook('S_ACTION_END', 1, {order: 100, filter: {fake: true}}, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			if (debug) {console.log('S_ACTION_END fake')}
			// if id matches fakeSkill
			if (event.id == fakeSkill.id) {
				inFakeSkill = false
				if (debug) {console.log('inFakeSkill', inFakeSkill)}
			}
		}
	})
	
	// detect real action end
	dispatch.hook('S_ACTION_END', 1, {order: 100, filter: {silenced: null}}, event => {
		// if character is your character
		if (event.source.equals(cid)) {
			if (debug) {console.log('S_ACTION_END real')}
			// if displaced
			if (specialCC) {
				// allow fake skills
				specialCC = false
				if (debug) {console.log('specialCC', specialCC)}
			}
			return true
		}
	})
}