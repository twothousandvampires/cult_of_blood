import PowerUp from "./PowerUp.js";
import LightningRailSpell from "../spells/LightningRailSpell.js";

export default class RailLightningPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'rail_lightning_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player, io){
        player.newSpell(new LightningRailSpell())
        io.sockets.to(player.socket_id).emit('update_spell', player.spell)
    }
}
