import PowerUp from "./PowerUp.js";
import FireBallSpell from "../spells/FireballSpell.js";

export default class FireballPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'fireball_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player, io){
        player.newSpell(new FireBallSpell())
        io.sockets.to(player.socket_id).emit('update_spell', player.spell)
    }
}