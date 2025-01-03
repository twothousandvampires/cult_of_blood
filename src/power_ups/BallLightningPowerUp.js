import PowerUp from "./PowerUp.js";
import LightningBoltSpell from "../spells/LightningBoltSpell.js";

export default class BallLightningPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'ball_lightning_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player, io){
        player.newSpell(new LightningBoltSpell())
        io.sockets.to(player.socket_id).emit('update_spell', player.spell)
    }
}