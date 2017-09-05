## Fix Ghost ![Fix Ghost](https://cdn.discordapp.com/emojis/316459407129051138.png "Fix Ghost")
Addon for Skill-Prediction. Tera-Proxy module for Tera Online. Blocks fake skills during crowd control.
### Warning
This module is still experimental.

It has *not* been throughly tested yet, and use is *at your own risk*.
### Requirements
[Tera-Proxy](https://github.com/meishuu/tera-proxy) and dependencies

[Skill-Prediction](https://github.com/pinkipi/skill-prediction) updated Sept. 4, 2017 or newer.

The following opcodes must be mapped in your `tera-proxy/node_modules/tera-data/map/protocol.{version}.map` file:
* S_ABNORMALITY_BEGIN
* S_ABNORMALITY_END
* S_ACTION_END
* S_ACTION_STAGE
* S_CREATURE_LIFE
* S_EACH_SKILL_RESULT
* S_INSTANT_MOVE
* S_LOGIN
### Reported Issues
* Push back in Harrowhold P4 instantly teleports you to the wall without push-back animation (may be fixed now).
* Spamming retaliate caused an immediate stand-up and allowed walking around client-side while knocked down server-side.
* CC sometimes caused silence until knocked down (may be fixed now).
