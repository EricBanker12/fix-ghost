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
        realSkill,
        specialCCSkill,
        inFakeSkill = false,
        newCCTime = 0,
        specialCCTimeout
    
    // get cid
    dispatch.hook('S_LOGIN', 1, event => {
        cid = event.cid
    })
    
    // get abnormality
    dispatch.hook('S_ABNORMALITY_BEGIN', 2, {order: 100, filter: {fake: null}}, event => {
        // if character is your character
        if (event.target.equals(cid)) {
            if (debug) {console.log(Date.now(), 'S_ABNORMALITY_BEGIN', event.id)}
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
            if (debug) {console.log(Date.now(), 'S_ABNORMALITY_END', event.id)}
            // if debuff is CC
            if (CC.includes(event.id)) {
                if (debug) {console.log('CC removed')}
                // remove from list of active CC
                myCC.splice(myCC.indexOf(event.id), 1)
            }
        }
    })

    // get stagger/KD/push
    dispatch.hook('S_EACH_SKILL_RESULT', 3, {order: 100, filter: {silenced: null}}, event => {
        // if character is your character
        if (event.target.equals(cid)) {
            if (debug) {console.log(Date.now(), 'S_EACH_SKILL_RESULT real')}
            // if KD, stagger, push-back, etc and not self-inflicted
            if (event.setTargetAction != 0 && !event.source.equals(cid)) {
                // prevent fake skills
                specialCC = true
                specialCCSkill = event
                // get CC durations
                let durations = []
                for (let index in event.targetMovement) {
                    durations.push(event.targetMovement[index].duration)
                }
                // set CC timeout to max duration
                specialCCTimeout = setTimeout(() => {
                    specialCC = false
                    if (debug) {console.log('specialCC', specialCC)}
                }, Math.max.apply(null, durations))
                if (debug) {console.log('specialCC', specialCC)}
                // if in fake skill
                if (debug) {console.log('inFakeSkill', inFakeSkill)}
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
                    dispatch.toClient('S_INSTANT_MOVE', 1, {
                        id: cid,
                        x: event.targetX,
                        y: event.targetY,
                        z: event.targetZ,
                        w: event.targetW
                    })
                    return true
                }
            }
            // if CC'd allow real skills
            if (CC.includes(myCC[0]) || specialCC) {
                if (debug) {console.log(Date.now(), 'CC - allow real skills')}
                return true
            } 
        }
    })

    // detect fake skills
    dispatch.hook('S_ACTION_STAGE', 1, {order: 100, filter: {fake: true}}, event => {
        // if character is your character
        if (event.source.equals(cid)) {
            if (debug) {console.log(Date.now(), 'S_ACTION_STAGE fake')}
            // if CC'd or displaced
            if (CC.includes(myCC[0]) || specialCC) {
                if (debug) {console.log('block fake skill')}
                // prevent fake skills
                return false
            }
            else {
                fakeSkill = event
                inFakeSkill = true
                if (debug) {console.log('inFakeSkill', inFakeSkill)}
            }
        }
    })
    
    // detect real skills
    dispatch.hook('S_ACTION_STAGE', 1, {order: 100, filter: {silenced: null}}, event => {
        // if character is your character
        if (event.source.equals(cid)) {
            if (debug) {console.log(Date.now(), 'S_ACTION_STAGE real')}
            // if CC'd within 10ms
            if (CC.includes(myCC[0]) && ((Date.now() - newCCTime) < 10)) {
                if (debug) {console.log('CC Animation')}
                // if in fake skill
                if (debug) {console.log('inFakeSkill', inFakeSkill)}
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
                    dispatch.toClient('S_INSTANT_MOVE', 1, {
                        id: cid,
                        x: event.x,
                        y: event.y,
                        z: event.z,
                        w: event.w
                    })
                    return true
                }
            }
            // if real action matches fake action
            if (inFakeSkill && event.skill == fakeSkill.skill) {
                realSkill = event
            }
            // if CC'd allow real skills
            if (CC.includes(myCC[0]) || specialCC) {
                if (debug) {console.log(Date.now(), 'CC - allow real skills')}
                return true
            }
        }
    })
    
    // detect fake action end
    dispatch.hook('S_ACTION_END', 1, {order: 100, filter: {fake: true}}, event => {
        // if character is your character
        if (event.source.equals(cid)) {
            if (debug) {console.log(Date.now(), 'S_ACTION_END fake')}
            // if id matches fakeSkill
            if (inFakeSkill && event.id == fakeSkill.id) {
                inFakeSkill = false
                if (debug) {console.log('inFakeSkill', inFakeSkill)}
                return
            }
            // if knocked down/up and retaliate
            if (specialCC && specialCCSkill && specialCCSkill.targetId == event.id) {
                // allow fake skill
                specialCC = false
                if (specialCCTimeout) {clearTimeout(specialCCTimeout)}
                if (debug) {console.log('specialCC', specialCC)}
                return
            }
            else {
                return false
            }
        }
    })
    
    // detect real action end
    dispatch.hook('S_ACTION_END', 1, {order: 100, filter: {silenced: null}}, event => {
        // if character is your character
        if (event.source.equals(cid)) {
            if (debug) {console.log(Date.now(), 'S_ACTION_END real')}
            // if displaced
            if (specialCC) {
                // allow fake skills
                specialCC = false
                if (specialCCTimeout) {clearTimeout(specialCCTimeout)}
                if (debug) {console.log('specialCC', specialCC)}
            }
            // if debug
            if (debug && inFakeSkill) {
                console.log('event.skill', event.skill, 'realSkill.skill', realSkill.skill, 'fakeSkill.skill', fakeSkill.skill)
                console.log('realSkill.stage', realSkill.stage, 'fakeSkill.stage', fakeSkill.stage)
                console.log('event.id', event.id, 'realSkill.id', realSkill.id, 'fakeSkill.id', fakeSkill.id)
            }
            // if in fake skill, and server-side recieved it, and no new fake skill has started
            if (inFakeSkill && realSkill && event.id == realSkill.id && realSkill.skill == fakeSkill.skill && realSkill.stage == fakeSkill.stage) {
                // allow ending fake skill
                inFakeSkill = false
                if (debug) {console.log('inFakeSkill', inFakeSkill)}
                event.id = fakeSkill.id
                return true
            }
            // if CC'd allow real skill end
            if (CC.includes(myCC[0]) || specialCC) {
                if (debug) {console.log(Date.now(), 'CC - allow real skill end')}
                return true
            }
        }
    })
    
    // detect fake displacement
    dispatch.hook('S_INSTANT_MOVE', 1, {order: 100, filter: {fake: true}}, event => {
        if (debug) {console.log(Date.now(), 'S_INSTANT_MOVE')}
    })
    
    // detect death
    dispatch.hook('S_CREATURE_LIFE', 1, event => {
        // if character is your character
        if(event.target.equals(cid)) {
            // if dead
            if (!event.alive) {
                if (debug) {console.log(Date.now(), 'You Died. CC cleared.')}
                // clear all CC
                myCC = []
                inFakeSkill = false
                specialCC = false
                if (specialCCTimeout) {clearTimeout(specialCCTimeout)}
            }
        }
    })
}
